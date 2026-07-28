type CreatorCreditProps = {
  className?: string;
};

export function CreatorCredit({
  className = "",
}: CreatorCreditProps) {
  return (
    <span className={className}>
      Plataforma criada por{" "}
      <strong>Diogo Jacob</strong> · contato.diogojacob@gmail.com · 47
      99198-1566
    </span>
  );
}