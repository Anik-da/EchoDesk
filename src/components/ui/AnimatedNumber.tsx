import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  unit?: string;
  className?: string;
}

export function AnimatedNumber({ value, decimals = 0, unit, className }: AnimatedNumberProps) {
  const display = useAnimatedNumber(value);
  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <span className={className}>
      {formatted}
      {unit && <span className="ml-0.5 text-[0.6em] opacity-60">{unit}</span>}
    </span>
  );
}
