export default function ProductLoading() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <div className="h-3 w-48 animate-pulse rounded bg-ink/10" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 lg:grid-cols-2 lg:gap-14">
        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 w-16 animate-pulse rounded-md bg-ink/10" />
            ))}
          </div>
          <div className="aspect-[3/4] flex-1 animate-pulse rounded-lg bg-ink/10" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-3 w-24 animate-pulse rounded bg-ink/10" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-ink/10" />
          <div className="h-5 w-24 animate-pulse rounded bg-ink/10" />
          <div className="mt-4 h-10 w-full animate-pulse rounded bg-ink/10" />
          <div className="h-10 w-full animate-pulse rounded bg-ink/10" />
          <div className="h-12 w-full animate-pulse rounded bg-ink/10" />
        </div>
      </div>
    </>
  );
}
