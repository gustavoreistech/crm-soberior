import { withAuth } from "next-auth/middleware"

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Define admin route paths (grupo de rotas (admin))
    const adminPaths = ["/", "/leads", "/settings"]
    const isAdminRoute = adminPaths.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    )

    // Se o usuário for CLIENT e tentar acessar rotas admin, redireciona para /dashboard
    if (token?.role === "CLIENT" && isAdminRoute) {
      return Response.redirect(new URL("/dashboard", req.url))
    }
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname

        // Rota de login é sempre pública
        if (pathname.startsWith("/login")) return true

        // Rotas protegidas dos grupos (admin) e (portal)
        const protectedPaths = [
          "/dashboard",
          "/documentos",
          "/faturas",
          "/leads",
          "/settings",
        ]
        const isProtected = protectedPaths.some(
          (path) => pathname === path || pathname.startsWith(path + "/")
        )

        // A raiz (/) é a página do admin, também protegida
        if (pathname === "/" || isProtected) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
