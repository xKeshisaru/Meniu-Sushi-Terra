export function Footer() {
  return (
    <footer className="bg-black py-8 text-center border-t border-white/5">
      <p className="text-sm text-zinc-500 font-medium">
        © {new Date().getFullYear()} Sushi Terra. All rights reserved.
      </p>
      <div className="mt-2 flex justify-center gap-4 text-xs text-zinc-400">
        <a href="#" className="hover:text-zinc-600">
          Termeni și condiții
        </a>
        <a href="#" className="hover:text-zinc-600">
          Politica de confidențialitate
        </a>
      </div>
    </footer>
  );
}
