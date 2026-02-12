import Link from "next/link";

export default function NotFoundScreen() {
  return (
    <div className="w-full h-dvh relative flex flex-col gap-6 justify-end items-end">
      <Link
        href="/"
        className="w-fit h-fit uppercase text-2xl p-4 md:p-8 leading-none hover:animate-pulse transition-all active:translate-x-1"
      >
        → Go back to Home
      </Link>
    </div>
  );
}

//page title
export const metadata = {
  title: "404",
};
