export default function Toast({ show, message }){
  if(!show) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-40 grid place-items-start">
      <div className="mt-4 mx-auto w-[min(92vw,520px)] pointer-events-auto rounded-2xl bg-neutral-900 text-white text-sm px-4 py-3 shadow-lg">
        {message}
      </div>
    </div>
  );
}
