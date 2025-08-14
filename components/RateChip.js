import { classNames } from "../lib/utils";
export default function RateChip({ label, active, onClick }){
  return (
    <button onClick={onClick} className={classNames("px-3 py-1.5 rounded-xl text-sm border transition", active?"bg-neutral-900 text-white border-neutral-900":"bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900")}>
      {label}
    </button>
  );
}
