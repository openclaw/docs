---
read_when:
    - Entendendo o que acontece na primeira execução do agente
    - Explicando onde ficam os arquivos de inicialização
    - Depuração da configuração de identidade da integração inicial
sidebarTitle: Bootstrapping
summary: Ritual de inicialização do agente que prepara o espaço de trabalho e os arquivos de identidade
title: Inicialização do agente
x-i18n:
    generated_at: "2026-07-12T15:46:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

A inicialização é o ritual da primeira execução que prepara um novo espaço de trabalho do agente e
orienta o agente na escolha de uma identidade. Ela é executada uma vez, logo após
a integração, no primeiro turno real do agente.

## O que acontece

Na primeira execução em um espaço de trabalho totalmente novo (o padrão é `~/.openclaw/workspace`),
o OpenClaw:

- Cria os arquivos iniciais `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Faz o agente seguir `BOOTSTRAP.md`: uma conversa em formato livre (não um formulário fixo de perguntas e respostas) para definir nome, personalidade e estilo.
- Registra o que aprendeu em `IDENTITY.md`, `USER.md` e `SOUL.md`.
- Exclui `BOOTSTRAP.md` quando o espaço de trabalho parece configurado, para que o ritual seja executado apenas uma vez.

Um espaço de trabalho é considerado configurado quando `SOUL.md`, `IDENTITY.md` ou `USER.md`
difere de seu modelo inicial, ou quando existe uma pasta `memory/`.

<Note>
`BOOTSTRAP.md` abrange toda a conversa sobre identidade. Consulte seu conteúdo no
[modelo de BOOTSTRAP.md](/pt-BR/reference/templates/BOOTSTRAP).
</Note>

## Execuções com modelos integrados e locais

Para execuções com modelos integrados ou locais, o OpenClaw mantém `BOOTSTRAP.md` fora do
contexto privilegiado do sistema. Na primeira execução interativa principal, ele ainda
transmite o conteúdo do arquivo pelo prompt do usuário, para que modelos que não
chamam a ferramenta `read` de forma confiável ainda possam concluir o ritual. Se a execução
atual não puder acessar o espaço de trabalho com segurança, o agente receberá uma breve observação
sobre a inicialização limitada em vez de uma saudação genérica.

## Como ignorar a inicialização

Para ignorá-la em um espaço de trabalho previamente preparado, execute:

```bash
openclaw onboard --skip-bootstrap
```

## Onde ela é executada

A inicialização sempre é executada no host do Gateway. Se o aplicativo para macOS se conectar a um
Gateway remoto, o espaço de trabalho e seus arquivos de inicialização ficarão nessa máquina
remota, não no Mac.

<Note>
Quando o Gateway for executado em outra máquina, edite os arquivos do espaço de trabalho no host do Gateway
(por exemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentação relacionada

- Integração do aplicativo para macOS: [Integração](/pt-BR/start/onboarding)
- Estrutura do espaço de trabalho: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- Conteúdo do modelo: [Modelo de BOOTSTRAP.md](/pt-BR/reference/templates/BOOTSTRAP)
