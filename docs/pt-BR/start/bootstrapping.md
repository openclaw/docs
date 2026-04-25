---
read_when:
    - Entender o que acontece na primeira execução do agente
    - Explicar onde ficam os arquivos de inicialização
    - Depurar a configuração de identidade do onboarding
sidebarTitle: Bootstrapping
summary: Ritual de inicialização do agente que prepara o workspace e os arquivos de identidade
title: Inicialização do agente
x-i18n:
    generated_at: "2026-04-25T13:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

A inicialização é o ritual de **primeira execução** que prepara um workspace do agente e
coleta detalhes de identidade. Ela acontece após o onboarding, quando o agente é iniciado
pela primeira vez.

## O que a inicialização faz

Na primeira execução do agente, o OpenClaw inicializa o workspace (padrão
`~/.openclaw/workspace`):

- Prepara `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Executa um breve ritual de perguntas e respostas (uma pergunta por vez).
- Grava identidade + preferências em `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Remove `BOOTSTRAP.md` ao terminar para que isso seja executado apenas uma vez.

## Ignorar a inicialização

Para ignorar isso em um workspace já preparado, execute `openclaw onboard --skip-bootstrap`.

## Onde ela é executada

A inicialização sempre é executada no **host do gateway**. Se o app do macOS se conectar a
um Gateway remoto, o workspace e os arquivos de inicialização ficarão nessa máquina
remota.

<Note>
Quando o Gateway é executado em outra máquina, edite os arquivos do workspace no host do gateway
(por exemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentação relacionada

- Onboarding do app macOS: [Onboarding](/pt-BR/start/onboarding)
- Layout do workspace: [Workspace do agente](/pt-BR/concepts/agent-workspace)
