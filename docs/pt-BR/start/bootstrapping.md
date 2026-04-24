---
read_when:
    - Entendendo o que acontece na primeira execução do agente
    - Explicando onde ficam os arquivos de inicialização
    - Depurando a configuração de identidade do onboarding
sidebarTitle: Bootstrapping
summary: Ritual de inicialização do agente que prepara o workspace e os arquivos de identidade
title: Inicialização do agente
x-i18n:
    generated_at: "2026-04-24T06:12:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

A inicialização é o ritual da **primeira execução** que prepara um workspace de agente e
coleta detalhes de identidade. Ela acontece após o onboarding, quando o agente é iniciado
pela primeira vez.

## O que a inicialização faz

Na primeira execução do agente, o OpenClaw inicializa o workspace (padrão
`~/.openclaw/workspace`):

- Prepara `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Executa um ritual curto de perguntas e respostas (uma pergunta por vez).
- Grava identidade + preferências em `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Remove `BOOTSTRAP.md` quando termina para que seja executado apenas uma vez.

## Onde isso é executado

A inicialização sempre é executada no **host do gateway**. Se o app do macOS se conectar a
um Gateway remoto, o workspace e os arquivos de inicialização ficam nessa máquina
remota.

<Note>
Quando o Gateway é executado em outra máquina, edite os arquivos do workspace no host do gateway
(por exemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentação relacionada

- Onboarding do app macOS: [Onboarding](/pt-BR/start/onboarding)
- Layout do workspace: [Workspace do agente](/pt-BR/concepts/agent-workspace)
