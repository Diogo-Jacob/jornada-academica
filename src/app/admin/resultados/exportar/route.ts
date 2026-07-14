import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

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

function formatNumberForCsv(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  return value.toFixed(2).replace(".", ",");
}

function escapeCsvValue(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");

  const escapedValue = stringValue.replace(/"/g, '""');

  return `"${escapedValue}"`;
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
      }: ${formatNumberForCsv(assignmentScore.score)}`;
    })
    .join(" | ");
}

export async function GET() {
  const { profile, supabase } = await getCurrentUser();

  if (
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    return NextResponse.redirect(new URL("/login", "http://localhost:3000"));
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
        "not_selected"
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
    new Set(
      assignments.map((assignment) => assignment.evaluator_id)
    )
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
        .filter(
          (assignment) => assignment.submission_id === submission.id
        )
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
        responsibleAuthorName:
          row.responsibleAuthor?.full_name ?? "",
        responsibleAuthorEmail:
          row.responsibleAuthor?.email ?? "",
        completedEvaluations:
          row.officialScore.completedEvaluations,
        allScoresText: getScoresText({
          scores: row.officialScore.allScores,
          evaluatorMap,
        }),
        consideredScoresText: getScoresText({
          scores: row.officialScore.consideredScores,
          evaluatorMap,
        }),
        officialAverage: row.officialScore.average,
        usedClosestPair: row.officialScore.usedClosestPair
          ? "Sim"
          : "Não",
        result: getAutomaticResultLabel(rank),
      };
    });

  const header = [
    "Classificação",
    "Título",
    "Protocolo",
    "Categoria",
    "Autor responsável",
    "E-mail do autor",
    "Avaliações concluídas",
    "Todas as notas recebidas",
    "Notas consideradas na média",
    "Média final oficial",
    "Usou regra das duas notas mais próximas",
    "Resultado automático",
  ];

  const csvRows = [
    header.map(escapeCsvValue).join(";"),
    ...rows.map((row) =>
      [
        row.rank,
        row.title,
        row.protocol,
        row.category,
        row.responsibleAuthorName,
        row.responsibleAuthorEmail,
        row.completedEvaluations,
        row.allScoresText,
        row.consideredScoresText,
        formatNumberForCsv(row.officialAverage),
        row.usedClosestPair,
        row.result,
      ]
        .map(escapeCsvValue)
        .join(";")
    ),
  ];

  const csvContent = `\uFEFF${csvRows.join("\n")}`;

  const now = new Date();

  const filename = `ranking-geral-jornada-${now
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}