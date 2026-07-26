import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Submission = {
  id: string;
  title: string;
  protocol: string | null;
  status: string;
  updated_at: string;
  submission_categories:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  submission_authors:
    | {
        id: string;
        full_name: string;
        email: string;
        author_role: string;
        display_order: number;
      }[]
    | null;
};

type Assignment = {
  id: string;
  submission_id: string;
  evaluator_id: string;
  status: string;
  assigned_at: string;
};

type EvaluationResponse = {
  assignment_id: string;
  score: number;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
};

type AssignmentScore = {
  assignment: Assignment;
  score: number;
};

type OfficialScoreResult = {
  average: number | null;
  completedEvaluations: number;
  consideredScores: AssignmentScore[];
  allScores: AssignmentScore[];
  usedClosestPair: boolean;
};

type RankingRow = {
  rank: number;
  title: string;
  protocol: string;
  category: string;
  responsibleAuthorName: string;
  responsibleAuthorEmail: string;
  completedEvaluations: number;
  allScoresText: string;
  consideredScoresText: string;
  officialAverage: number | null;
  usedClosestPair: string;
  result: string;
};

function getCategoryName(submission: Submission) {
  const categoryValue = submission.submission_categories;

  const category = Array.isArray(categoryValue)
    ? categoryValue[0]
    : categoryValue;

  return category?.name ?? "Categoria não informada";
}

function getResponsibleAuthor(submission: Submission) {
  const authors = [...(submission.submission_authors ?? [])].sort(
    (firstAuthor, secondAuthor) =>
      firstAuthor.display_order - secondAuthor.display_order
  );

  return (
    authors.find(
      (author) =>
        author.author_role === "responsible" ||
        author.display_order === 1
    ) ?? null
  );
}

function getAssignmentScore({
  assignmentId,
  responses,
}: {
  assignmentId: string;
  responses: EvaluationResponse[];
}) {
  const assignmentResponses = responses.filter(
    (response) => response.assignment_id === assignmentId
  );

  if (!assignmentResponses.length) {
    return null;
  }

  return assignmentResponses.reduce(
    (total, response) => total + Number(response.score),
    0
  );
}

function getOfficialScoreResult({
  assignments,
  responses,
}: {
  assignments: Assignment[];
  responses: EvaluationResponse[];
}): OfficialScoreResult {
  const completedScores = assignments
    .filter((assignment) => assignment.status === "completed")
    .map((assignment) => {
      const score = getAssignmentScore({
        assignmentId: assignment.id,
        responses,
      });

      if (score === null) {
        return null;
      }

      return {
        assignment,
        score,
      };
    })
    .filter(
      (item): item is AssignmentScore =>
        item !== null && !Number.isNaN(item.score)
    );

  if (completedScores.length < 2) {
    return {
      average: null,
      completedEvaluations: completedScores.length,
      consideredScores: [],
      allScores: completedScores,
      usedClosestPair: false,
    };
  }

  if (completedScores.length === 2) {
    const average =
      completedScores.reduce((total, item) => total + item.score, 0) /
      completedScores.length;

    return {
      average,
      completedEvaluations: completedScores.length,
      consideredScores: completedScores,
      allScores: completedScores,
      usedClosestPair: false,
    };
  }

  const pairs: {
    first: AssignmentScore;
    second: AssignmentScore;
    difference: number;
    average: number;
  }[] = [];

  for (let firstIndex = 0; firstIndex < completedScores.length; firstIndex++) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < completedScores.length;
      secondIndex++
    ) {
      const first = completedScores[firstIndex];
      const second = completedScores[secondIndex];

      const difference = Math.abs(first.score - second.score);
      const average = (first.score + second.score) / 2;

      pairs.push({
        first,
        second,
        difference,
        average,
      });
    }
  }

  const selectedPair = pairs.sort((firstPair, secondPair) => {
    const differenceComparison =
      firstPair.difference - secondPair.difference;

    if (differenceComparison !== 0) {
      return differenceComparison;
    }

    const averageComparison =
      secondPair.average - firstPair.average;

    if (averageComparison !== 0) {
      return averageComparison;
    }

    return firstPair.first.assignment.assigned_at.localeCompare(
      secondPair.first.assignment.assigned_at
    );
  })[0];

  return {
    average: selectedPair.average,
    completedEvaluations: completedScores.length,
    consideredScores: [selectedPair.first, selectedPair.second],
    allScores: completedScores,
    usedClosestPair: true,
  };
}

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  return Number(value.toFixed(2));
}

function getAutomaticResultLabel(rank: number | null) {
  if (!rank) {
    return "Aguardando conclusão";
  }

  if (rank <= 5) {
    return "Apresentação oral";
  }

  return "Banner";
}

function getScoresText({
  scores,
  evaluatorMap,
}: {
  scores: AssignmentScore[];
  evaluatorMap: Map<string, Profile>;
}) {
  if (!scores.length) {
    return "";
  }

  return scores
    .map((assignmentScore) => {
      const evaluator = evaluatorMap.get(
        assignmentScore.assignment.evaluator_id
      );

      return `${
        evaluator?.full_name ?? "Avaliador não localizado"
      }: ${assignmentScore.score.toFixed(2).replace(".", ",")}`;
    })
    .join(" | ");
}

function styleWorksheet(worksheet: ExcelJS.Worksheet, rowsLength: number) {
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 5,
    },
  ];

  worksheet.properties.defaultRowHeight = 22;

  worksheet.columns = [
    { key: "rank", width: 16 },
    { key: "title", width: 44 },
    { key: "protocol", width: 22 },
    { key: "category", width: 28 },
    { key: "responsibleAuthorName", width: 28 },
    { key: "responsibleAuthorEmail", width: 32 },
    { key: "completedEvaluations", width: 22 },
    { key: "allScoresText", width: 44 },
    { key: "consideredScoresText", width: 44 },
    { key: "officialAverage", width: 18 },
    { key: "usedClosestPair", width: 28 },
    { key: "result", width: 24 },
  ];

  worksheet.mergeCells("A1:L1");
  worksheet.mergeCells("A2:L2");
  worksheet.mergeCells("A3:L3");

  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Jornada Acadêmica de Medicina";
  titleCell.font = {
    bold: true,
    size: 18,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF102A3D" },
  };

  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "Ranking geral de resultados";
  subtitleCell.font = {
    bold: true,
    size: 13,
    color: { argb: "FFFFFFFF" },
  };
  subtitleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  subtitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF245B7A" },
  };

  const generatedAtCell = worksheet.getCell("A3");
  generatedAtCell.value = `Arquivo gerado em ${new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date())}`;
  generatedAtCell.font = {
    size: 11,
    color: { argb: "FF4A6678" },
  };
  generatedAtCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  generatedAtCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF7FA" },
  };

  worksheet.getRow(1).height = 30;
  worksheet.getRow(2).height = 24;
  worksheet.getRow(3).height = 22;
  worksheet.getRow(4).height = 8;

  const headerRow = worksheet.getRow(5);

  headerRow.values = [
    "Classificação",
    "Título do trabalho",
    "Protocolo",
    "Categoria",
    "Autor responsável",
    "E-mail do autor",
    "Avaliações concluídas",
    "Todas as notas recebidas",
    "Notas consideradas na média",
    "Média final oficial",
    "Regra das 2 notas mais próximas",
    "Resultado final",
  ];

  headerRow.height = 28;
  headerRow.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF102A3D" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD9E8EF" } },
      left: { style: "thin", color: { argb: "FFD9E8EF" } },
      bottom: { style: "thin", color: { argb: "FFD9E8EF" } },
      right: { style: "thin", color: { argb: "FFD9E8EF" } },
    };
  });

  const firstDataRow = 6;
  const lastDataRow = firstDataRow + rowsLength - 1;

  if (rowsLength > 0) {
    worksheet.autoFilter = {
      from: {
        row: 5,
        column: 1,
      },
      to: {
        row: lastDataRow,
        column: 12,
      },
    };

    for (let rowNumber = firstDataRow; rowNumber <= lastDataRow; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const isEvenRow = rowNumber % 2 === 0;

      row.height = 42;

      row.eachCell((cell, columnNumber) => {
        cell.alignment = {
          vertical: "middle",
          horizontal:
            [1, 7, 10, 11, 12].includes(columnNumber) ? "center" : "left",
          wrapText: true,
        };

        cell.font = {
          color: { argb: "FF102A3D" },
          size: 11,
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: isEvenRow ? "FFFFFFFF" : "FFF7FBFD",
          },
        };

        cell.border = {
          top: { style: "thin", color: { argb: "FFD9E8EF" } },
          left: { style: "thin", color: { argb: "FFD9E8EF" } },
          bottom: { style: "thin", color: { argb: "FFD9E8EF" } },
          right: { style: "thin", color: { argb: "FFD9E8EF" } },
        };
      });

      const rankCell = row.getCell(1);
      rankCell.font = {
        bold: true,
        color: { argb: "FF102A3D" },
        size: 12,
      };

      const averageCell = row.getCell(10);
      averageCell.numFmt = "0.00";
      averageCell.font = {
        bold: true,
        color: { argb: "FF102A3D" },
        size: 12,
      };

      const resultCell = row.getCell(12);
      const resultValue = String(resultCell.value ?? "");

      if (resultValue === "Apresentação oral") {
        resultCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE7F8EE" },
        };
        resultCell.font = {
          bold: true,
          color: { argb: "FF166534" },
          size: 11,
        };
      }

      if (resultValue === "Banner") {
        resultCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEF7FA" },
        };
        resultCell.font = {
          bold: true,
          color: { argb: "FF245B7A" },
          size: 11,
        };
      }
    }
  }

  worksheet.addRow([]);

  const ruleRowNumber = rowsLength > 0 ? lastDataRow + 2 : 7;
  worksheet.mergeCells(`A${ruleRowNumber}:L${ruleRowNumber}`);

  const ruleCell = worksheet.getCell(`A${ruleRowNumber}`);
  ruleCell.value =
    "Regra: os 5 trabalhos com maiores médias finais oficiais são classificados para apresentação oral. Os demais trabalhos avaliados são classificados para banner. Quando há terceiro avaliador, a média final considera as duas notas mais próximas.";
  ruleCell.font = {
    italic: true,
    color: { argb: "FF4A6678" },
    size: 10,
  };
  ruleCell.alignment = {
    wrapText: true,
    vertical: "middle",
  };
  ruleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF7FA" },
  };
  ruleCell.border = {
    top: { style: "thin", color: { argb: "FFD9E8EF" } },
    left: { style: "thin", color: { argb: "FFD9E8EF" } },
    bottom: { style: "thin", color: { argb: "FFD9E8EF" } },
    right: { style: "thin", color: { argb: "FFD9E8EF" } },
  };
  worksheet.getRow(ruleRowNumber).height = 45;
}

function addRowsToWorksheet(
  worksheet: ExcelJS.Worksheet,
  rows: RankingRow[]
) {
  rows.forEach((row) => {
    worksheet.addRow({
      rank: row.rank,
      title: row.title,
      protocol: row.protocol,
      category: row.category,
      responsibleAuthorName: row.responsibleAuthorName,
      responsibleAuthorEmail: row.responsibleAuthorEmail,
      completedEvaluations: row.completedEvaluations,
      allScoresText: row.allScoresText,
      consideredScoresText: row.consideredScoresText,
      officialAverage: formatNumber(row.officialAverage),
      usedClosestPair: row.usedClosestPair,
      result: row.result,
    });
  });
}

export async function GET(request: Request) {
  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: submissionsData, error: submissionsError } =
    await supabase
      .from("submissions")
      .select(`
        id,
        title,
        protocol,
        status,
        updated_at,

        submission_categories (
          name
        ),

        submission_authors (
          id,
          full_name,
          email,
          author_role,
          display_order
        )
      `)
      .in("status", [
        "under_evaluation",
        "one_evaluation_completed",
        "evaluations_completed",
        "pending_confirmation",
        "result_confirmed",
        "selected_oral",
        "selected_banner",
        "not_selected",
      ])
      .order("updated_at", {
        ascending: false,
      });

  if (submissionsError) {
    console.error("Erro ao carregar submissões para exportação:", {
      message: submissionsError.message,
      details: submissionsError.details,
      hint: submissionsError.hint,
      code: submissionsError.code,
    });

    return new NextResponse(
      "Não foi possível carregar as submissões.",
      {
        status: 500,
      }
    );
  }

  const submissions = (submissionsData ?? []) as Submission[];

  const submissionIds = submissions.map((submission) => submission.id);

  let assignments: Assignment[] = [];

  if (submissionIds.length > 0) {
    const { data: assignmentsData, error: assignmentsError } =
      await supabase
        .from("evaluation_assignments")
        .select(`
          id,
          submission_id,
          evaluator_id,
          status,
          assigned_at
        `)
        .in("submission_id", submissionIds)
        .in("status", [
          "assigned",
          "in_progress",
          "completed",
          "declined",
          "cancelled",
        ]);

    if (assignmentsError) {
      console.error("Erro ao carregar avaliações para exportação:", {
        message: assignmentsError.message,
        details: assignmentsError.details,
        hint: assignmentsError.hint,
        code: assignmentsError.code,
      });

      return new NextResponse(
        "Não foi possível carregar as avaliações.",
        {
          status: 500,
        }
      );
    }

    assignments = (assignmentsData ?? []) as Assignment[];
  }

  const evaluatorIds = Array.from(
    new Set(assignments.map((assignment) => assignment.evaluator_id))
  );

  let evaluators: Profile[] = [];

  if (evaluatorIds.length > 0) {
    const { data: evaluatorsData, error: evaluatorsError } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email
        `)
        .in("id", evaluatorIds);

    if (evaluatorsError) {
      console.error("Erro ao carregar avaliadores para exportação:", {
        message: evaluatorsError.message,
        details: evaluatorsError.details,
        hint: evaluatorsError.hint,
        code: evaluatorsError.code,
      });

      return new NextResponse(
        "Não foi possível carregar os avaliadores.",
        {
          status: 500,
        }
      );
    }

    evaluators = (evaluatorsData ?? []) as Profile[];
  }

  const evaluatorMap = new Map(
    evaluators.map((evaluator) => [evaluator.id, evaluator])
  );

  const assignmentIds = assignments.map((assignment) => assignment.id);

  let responses: EvaluationResponse[] = [];

  if (assignmentIds.length > 0) {
    const { data: responsesData, error: responsesError } =
      await supabase
        .from("evaluation_responses")
        .select(`
          assignment_id,
          score
        `)
        .in("assignment_id", assignmentIds);

    if (responsesError) {
      console.error("Erro ao carregar notas para exportação:", {
        message: responsesError.message,
        details: responsesError.details,
        hint: responsesError.hint,
        code: responsesError.code,
      });

      return new NextResponse(
        "Não foi possível carregar as notas.",
        {
          status: 500,
        }
      );
    }

    responses = (responsesData ?? []) as EvaluationResponse[];
  }

  const rows = submissions
    .map((submission) => {
      const submissionAssignments = assignments
        .filter((assignment) => assignment.submission_id === submission.id)
        .sort((firstAssignment, secondAssignment) =>
          firstAssignment.assigned_at.localeCompare(
            secondAssignment.assigned_at
          )
        );

      const officialScore = getOfficialScoreResult({
        assignments: submissionAssignments,
        responses,
      });

      const responsibleAuthor = getResponsibleAuthor(submission);

      return {
        submission,
        responsibleAuthor,
        officialScore,
      };
    })
    .filter((row) => row.officialScore.average !== null)
    .sort((firstRow, secondRow) => {
      const averageDiff =
        Number(secondRow.officialScore.average) -
        Number(firstRow.officialScore.average);

      if (averageDiff !== 0) {
        return averageDiff;
      }

      return firstRow.submission.title.localeCompare(
        secondRow.submission.title
      );
    })
    .map((row, index) => {
      const rank = index + 1;

      return {
        rank,
        title: row.submission.title,
        protocol: row.submission.protocol ?? "",
        category: getCategoryName(row.submission),
        responsibleAuthorName: row.responsibleAuthor?.full_name ?? "",
        responsibleAuthorEmail: row.responsibleAuthor?.email ?? "",
        completedEvaluations: row.officialScore.completedEvaluations,
        allScoresText: getScoresText({
          scores: row.officialScore.allScores,
          evaluatorMap,
        }),
        consideredScoresText: getScoresText({
          scores: row.officialScore.consideredScores,
          evaluatorMap,
        }),
        officialAverage: row.officialScore.average,
        usedClosestPair: row.officialScore.usedClosestPair ? "Sim" : "Não",
        result: getAutomaticResultLabel(rank),
      };
    });

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Jornada Acadêmica de Medicina";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Ranking geral", {
    properties: {
      tabColor: {
        argb: "FF102A3D",
      },
    },
  });

  addRowsToWorksheet(worksheet, rows);
  styleWorksheet(worksheet, rows.length);

  const now = new Date();

  const filename = `ranking-geral-jornada-${now
    .toISOString()
    .slice(0, 10)}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}