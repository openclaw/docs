---
read_when:
    - Entendendo o que acontece na primeira execução do agente
    - Explicando onde ficam os arquivos de inicialização
    - Depuração da configuração de identidade na integração inicial
sidebarTitle: Bootstrapping
summary: Ritual de inicialização do agente que prepara o workspace e os arquivos de identidade
title: Inicialização do agente
x-i18n:
    generated_at: "2026-07-12T00:24:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

O bootstrap é o ritual da primeira execução que prepara um novo espaço de trabalho do agente e
orienta o agente na escolha de uma identidade. Ele é executado uma única vez, logo após
a integração, no primeiro turno real do agente.

## O que acontece

Na primeira execução em um espaço de trabalho totalmente novo (o padrão é `~/.openclaw/workspace`),
o OpenClaw:

- Cria inicialmente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Faz o agente seguir `BOOTSTRAP.md`: uma conversa em formato livre (não um formulário fixo de perguntas e respostas) para definir um nome, uma personalidade e um estilo.
- Registra o que aprende em `IDENTITY.md`, `USER.md` e `SOUL.md`.
- Exclui `BOOTSTRAP.md` assim que o espaço de trabalho parece configurado, para que o ritual seja executado apenas uma vez.

Um espaço de trabalho é considerado configurado quando `SOUL.md`, `IDENTITY.md` ou `USER.md`
difere de seu modelo inicial, ou quando existe uma pasta `memory/`.

<Note>
`BOOTSTRAP.md` abrange toda a conversa sobre identidade. Consulte seu conteúdo no
[modelo de BOOTSTRAP.md](/pt-BR/reference/templates/BOOTSTRAP).
</Note>

## Execuções com modelos integrados e locais

Para execuções com modelos integrados ou locais, o OpenClaw mantém `BOOTSTRAP.md` fora do
contexto privilegiado do sistema. Na primeira execução interativa principal, ele ainda
transmite o conteúdo do arquivo por meio do prompt do usuário, para que modelos que não
chamam a ferramenta `read` de forma confiável ainda consigam concluir o ritual. Se a execução
atual não puder acessar o espaço de trabalho com segurança, o agente receberá uma breve observação
sobre bootstrap limitado em vez de uma saudação genérica.

## Como ignorar o bootstrap

Para ignorar essa etapa em um espaço de trabalho previamente preparado, execute:

```bash
openclaw onboard --skip-bootstrap
```

## Onde ele é executado

O bootstrap sempre é executado no host do Gateway. Se o aplicativo para macOS se conectar a um
Gateway remoto, o espaço de trabalho e seus arquivos de bootstrap ficarão nessa máquina
remota, não no Mac.

<Note>
Quando o Gateway for executado em outra máquina, edite os arquivos do espaço de trabalho no host do Gateway
(por exemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentação relacionada

- Integração do aplicativo para macOS: [Integração](/pt-BR/start/onboarding)
- Estrutura do espaço de trabalho: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- Conteúdo do modelo: [Modelo de BOOTSTRAP.md](/pt-BR/reference/templates/BOOTSTRAP)
