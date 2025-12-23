export function isMostPopular(code: string) {
  return code === "interior_refresh";
}

export function accentClass(code: string) {
  switch (code) {
    case "exterior_refresh":
      return "from-sky-500 to-indigo-600";
    case "interior_refresh":
      return "from-indigo-600 to-fuchsia-500";
    case "full_detail":
      return "from-slate-900 to-indigo-700";
    case "full_interior":
      return "from-rose-600 to-amber-500";
    case "paint_enhancement":
      return "from-emerald-600 to-sky-600";
    default:
      return "from-indigo-600 to-sky-500";
  }
}
