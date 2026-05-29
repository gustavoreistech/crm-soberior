import { prisma } from "./src/lib/prisma"
import bcrypt from "bcrypt"

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n")

  // ── Limpeza segura ─────────────────────────────────────
  console.log("→ Limpando dados existentes...")
  await prisma.user.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.project.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.organization.deleteMany()
  console.log("  ✓ Dados removidos\n")

  // ── Organization ────────────────────────────────────────
  console.log("→ Criando organização...")
  const organization = await prisma.organization.create({
    data: {
      name: "Soberior Admin",
    },
  })
  console.log(`  ✓ Organization: "${organization.name}" (${organization.id})\n`)

  // ── Admin User ──────────────────────────────────────────
  console.log("→ Criando usuário administrador...")
  const passwordHash = await bcrypt.hash("soberior123", 10)

  const user = await prisma.user.create({
    data: {
      email: "suporte@soberior.com",
      passwordHash,
      role: "ADMIN",
      organizationId: organization.id,
    },
  })
  console.log(`  ✓ User: "${user.email}" (role: ${user.role})`)
  console.log(`  ✓ ID: ${user.id}`)
  console.log(`  ✓ Senha: soberior123\n`)

  console.log("✅ Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
