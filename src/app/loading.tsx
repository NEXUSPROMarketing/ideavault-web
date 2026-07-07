import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="shell py-10">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <CardGridSkeleton count={6} />
      </div>
    </div>
  );
}
