import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | KubeCart` : "KubeCart | Online Shopping";
  }, [title]);
}
