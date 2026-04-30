---
read_when:
    - Entendendo o que acontece na primeira execução do agente
    - Explicando onde ficam os arquivos de inicialização
    - Depuração da configuração de identidade na integração inicial
sidebarTitle: Bootstrapping
summary: Ritual de inicialização do agente que popula o espaço de trabalho e os arquivos de identidade
title: Inicialização do agente
x-i18n:
    generated_at: "2026-04-30T10:09:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

A inicialização é o ritual de **primeira execução** que prepara um espaço de trabalho do agente e
coleta detalhes de identidade. Ela acontece após a integração, quando o agente é iniciado
pela primeira vez.

## O que a inicialização faz

Na primeira execução do agente, o OpenClaw inicializa o espaço de trabalho (padrão
`~/.openclaw/workspace`):

- Preenche `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Executa um breve ritual de perguntas e respostas (uma pergunta por vez).
- Grava identidade + preferências em `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Remove `BOOTSTRAP.md` ao finalizar, para que seja executado apenas uma vez.

Para execuções de modelos embutidos/locais, o OpenClaw mantém `BOOTSTRAP.md` fora do
contexto de sistema privilegiado. Na primeira execução interativa principal, ele ainda passa
o conteúdo do arquivo no prompt do usuário para que modelos que não chamam de forma confiável a ferramenta
`read` possam concluir o ritual. Se a execução atual não puder acessar com segurança o
espaço de trabalho, o agente recebe uma nota de inicialização limitada em vez de uma saudação genérica.

## Como pular a inicialização

Para pular isso em um espaço de trabalho pré-preenchido, execute `openclaw onboard --skip-bootstrap`.

## Onde ela é executada

A inicialização sempre é executada no **host do Gateway**. Se o aplicativo macOS se conectar a
um Gateway remoto, o espaço de trabalho e os arquivos de inicialização ficam nessa máquina
remota.

<Note>
Quando o Gateway é executado em outra máquina, edite os arquivos do espaço de trabalho no host do gateway
(por exemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentos relacionados

- Integração do aplicativo macOS: [Integração](/pt-BR/start/onboarding)
- Layout do espaço de trabalho: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
