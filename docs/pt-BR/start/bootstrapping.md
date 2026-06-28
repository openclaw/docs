---
read_when:
    - Entendendo o que acontece na primeira execução do agente
    - Explicando onde ficam os arquivos de inicialização
    - Depuração da configuração de identidade durante a integração
sidebarTitle: Bootstrapping
summary: Ritual de inicialização do agente que prepara o espaço de trabalho e os arquivos de identidade
title: Inicialização do agente
x-i18n:
    generated_at: "2026-05-06T09:14:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
    postprocess_version: locale-links-v1
---

A inicialização é o ritual de **primeira execução** que prepara um espaço de
trabalho do agente e coleta detalhes de identidade. Ela acontece após a
integração, quando o agente é iniciado pela primeira vez.

## O que a inicialização faz

Na primeira execução do agente, o OpenClaw inicializa o espaço de trabalho
(padrão `~/.openclaw/workspace`):

- Cria `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Executa um breve ritual de perguntas e respostas (uma pergunta por vez).
- Grava identidade + preferências em `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Remove `BOOTSTRAP.md` ao terminar, para que ele seja executado apenas uma vez.

Para execuções com modelos incorporados/locais, o OpenClaw mantém `BOOTSTRAP.md`
fora do contexto de sistema privilegiado. Na primeira execução interativa
principal, ele ainda passa o conteúdo do arquivo no prompt do usuário para que
modelos que não chamam a ferramenta `read` de forma confiável possam concluir o
ritual. Se a execução atual não puder acessar o espaço de trabalho com
segurança, o agente recebe uma nota de inicialização limitada em vez de uma
saudação genérica.

## Como pular a inicialização

Para pular isso em um espaço de trabalho pré-preenchido, execute `openclaw onboard --skip-bootstrap`.

## Onde ela é executada

A inicialização sempre é executada no **host do Gateway**. Se o app para macOS se
conectar a um Gateway remoto, o espaço de trabalho e os arquivos de inicialização
ficarão nessa máquina remota.

<Note>
Quando o Gateway é executado em outra máquina, edite os arquivos do espaço de
trabalho no host do Gateway (por exemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentação relacionada

- Integração do app para macOS: [Integração](/pt-BR/start/onboarding)
- Layout do espaço de trabalho: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
