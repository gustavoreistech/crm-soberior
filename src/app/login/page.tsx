export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <form>
        <div>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" name="email" />
        </div>
        <div>
          <label htmlFor="password">Senha</label>
          <input id="password" type="password" name="password" />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}
