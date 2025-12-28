export default function ChangelogPage() {
  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-(--breakpoint-2xl)">
        <div className="flex gap-8 lg:gap-12 xl:gap-16">
          <main className="flex-1 min-w-0 py-8 lg:py-12 px-6 md:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-4xl">
              <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">Changelog</h1>
                <p className="text-xl text-muted-foreground">
                  Recent updates and improvements to our documentation
                </p>
              </div>
              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-4">
                  <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
                  <p className="text-muted-foreground">
                    Changelog entries will be displayed here.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


