---
read_when:
    - Integração de uma nova instância de assistente
    - Analisando implicações de segurança/permissão
summary: Guia de ponta a ponta para executar o OpenClaw como assistente pessoal com precauções de segurança
title: Configuração do assistente pessoal
x-i18n:
    generated_at: "2026-05-11T20:35:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 74dd13c4b43faa8e29e1fd56a355f36c6cf7c3fa8193bb62c1056211933f4df9
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw é um Gateway auto-hospedado que conecta Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e outros a agentes de IA. Este guia aborda a configuração de "assistente pessoal": um número dedicado do WhatsApp que se comporta como seu assistente de IA sempre ativo.

## ⚠️ Segurança em primeiro lugar

Você está colocando um agente em uma posição para:

- executar comandos na sua máquina (dependendo da sua política de ferramentas)
- ler/gravar arquivos no seu workspace
- enviar mensagens de volta via WhatsApp/Telegram/Discord/Mattermost e outros canais incluídos

Comece de forma conservadora:

- Sempre defina `channels.whatsapp.allowFrom` (nunca execute aberto para o mundo no seu Mac pessoal).
- Use um número dedicado do WhatsApp para o assistente.
- Heartbeats agora usam por padrão o intervalo de 30 minutos. Desative até confiar na configuração definindo `agents.defaults.heartbeat.every: "0m"`.

## Pré-requisitos

- OpenClaw instalado e com onboarding concluído - consulte [Introdução](/pt-BR/start/getting-started) se ainda não fez isso
- Um segundo número de telefone (SIM/eSIM/pré-pago) para o assistente

## A configuração com dois telefones (recomendada)

Você quer isto:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Se você vincular seu WhatsApp pessoal ao OpenClaw, toda mensagem enviada a você se torna "entrada do agente". Isso raramente é o que você quer.

## Início rápido em 5 minutos

1. Pareie o WhatsApp Web (mostra o QR; escaneie com o telefone do assistente):

```bash
openclaw channels login
```

2. Inicie o Gateway (deixe-o em execução):

```bash
openclaw gateway --port 18789
```

3. Coloque uma configuração mínima em `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Agora envie uma mensagem para o número do assistente a partir do seu telefone na lista de permissões.

Quando o onboarding termina, o OpenClaw abre automaticamente o dashboard e imprime um link limpo (sem token). Se o dashboard solicitar autenticação, cole o segredo compartilhado configurado nas configurações da Control UI. O onboarding usa um token por padrão (`gateway.auth.token`), mas a autenticação por senha também funciona se você tiver alterado `gateway.auth.mode` para `password`. Para reabrir mais tarde: `openclaw dashboard`.

## Dê ao agente um workspace (AGENTS)

O OpenClaw lê instruções operacionais e "memória" a partir do diretório de workspace dele.

Por padrão, o OpenClaw usa `~/.openclaw/workspace` como o workspace do agente e o criará (além dos arquivos iniciais `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) automaticamente na configuração/primeira execução do agente. `BOOTSTRAP.md` só é criado quando o workspace é completamente novo (ele não deve voltar depois que você o excluir). `MEMORY.md` é opcional (não é criado automaticamente); quando presente, ele é carregado para sessões normais. Sessões de subagentes injetam apenas `AGENTS.md` e `TOOLS.md`.

<Tip>
Trate esta pasta como a memória do OpenClaw e transforme-a em um repositório git (idealmente privado) para que seu `AGENTS.md` e arquivos de memória tenham backup. Se o git estiver instalado, workspaces totalmente novos são inicializados automaticamente.
</Tip>

```bash
openclaw setup
```

Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)
Fluxo de trabalho de memória: [Memória](/pt-BR/concepts/memory)

Opcional: escolha um workspace diferente com `agents.defaults.workspace` (suporta `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Se você já entrega seus próprios arquivos de workspace a partir de um repositório, pode desativar completamente a criação de arquivos de bootstrap:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## A configuração que o transforma em "um assistente"

O OpenClaw já vem com uma boa configuração de assistente por padrão, mas normalmente você vai querer ajustar:

- persona/instruções em [`SOUL.md`](/pt-BR/concepts/soul)
- padrões de raciocínio (se desejado)
- Heartbeats (quando você confiar nele)

Exemplo:

```json5
{
  logging: { level: "info" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      workspace: "~/.openclaw/workspace",
      thinkingDefault: "high",
      timeoutSeconds: 1800,
      // Start with 0; enable later.
      heartbeat: { every: "0m" },
    },
    list: [
      {
        id: "main",
        default: true,
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sessões e memória

- Arquivos de sessão: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadados da sessão (uso de tokens, última rota etc.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (legado: `~/.openclaw/sessions/sessions.json`)
- `/new` ou `/reset` inicia uma nova sessão para esse chat (configurável via `resetTriggers`). Se enviado sozinho, o OpenClaw confirma a redefinição sem invocar o modelo.
- `/compact [instructions]` compacta o contexto da sessão e informa o orçamento de contexto restante.

## Heartbeats (modo proativo)

Por padrão, o OpenClaw executa um Heartbeat a cada 30 minutos com o prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Defina `agents.defaults.heartbeat.every: "0m"` para desativar.

- Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e cabeçalhos Markdown como `# Heading`), o OpenClaw ignora a execução do Heartbeat para economizar chamadas de API.
- Se o arquivo estiver ausente, o Heartbeat ainda é executado e o modelo decide o que fazer.
- Se o agente responder com `HEARTBEAT_OK` (opcionalmente com um preenchimento curto; veja `agents.defaults.heartbeat.ackMaxChars`), o OpenClaw suprime a entrega de saída para esse Heartbeat.
- Por padrão, a entrega de Heartbeat para alvos `user:<id>` no estilo DM é permitida. Defina `agents.defaults.heartbeat.directPolicy: "block"` para suprimir a entrega a alvos diretos enquanto mantém as execuções de Heartbeat ativas.
- Heartbeats executam turnos completos do agente - intervalos mais curtos consomem mais tokens.

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "30m" },
    },
  },
}
```

## Mídia de entrada e saída

Anexos de entrada (imagens/áudio/documentos) podem ser disponibilizados ao seu comando via templates:

- `{{MediaPath}}` (caminho local do arquivo temporário)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (se a transcrição de áudio estiver habilitada)

Anexos de saída do agente: inclua `MEDIA:<path-or-url>` em uma linha própria (sem espaços). Exemplo:

```
Here's the screenshot.
MEDIA:https://example.com/screenshot.png
```

O OpenClaw extrai esses itens e os envia como mídia junto com o texto.

O comportamento de caminhos locais segue o mesmo modelo de confiança de leitura de arquivos do agente:

- Se `tools.fs.workspaceOnly` for `true`, caminhos locais `MEDIA:` de saída permanecem restritos à raiz temporária do OpenClaw, ao cache de mídia, aos caminhos do workspace do agente e a arquivos gerados pelo sandbox.
- Se `tools.fs.workspaceOnly` for `false`, `MEDIA:` de saída pode usar arquivos locais do host que o agente já tem permissão para ler.
- Caminhos locais podem ser absolutos, relativos ao workspace ou relativos ao diretório inicial com `~/`.
- Envios locais do host ainda permitem apenas mídia e tipos seguros de documentos (imagens, áudio, vídeo, PDF e documentos do Office). Arquivos de texto simples e com aparência de segredo não são tratados como mídia enviável.

Isso significa que imagens/arquivos gerados fora do workspace agora podem ser enviados quando sua política de fs já permite essas leituras, sem reabrir a exfiltração arbitrária de anexos de texto do host.

## Checklist de operações

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

Os logs ficam em `/tmp/openclaw/` (padrão: `openclaw-YYYY-MM-DD.log`).

## Próximos passos

- WebChat: [WebChat](/pt-BR/web/webchat)
- Operações do Gateway: [Runbook do Gateway](/pt-BR/gateway)
- Cron + despertares: [Tarefas Cron](/pt-BR/automation/cron-jobs)
- Companion da barra de menus do macOS: [App OpenClaw para macOS](/pt-BR/platforms/macos)
- App Node para iOS: [App iOS](/pt-BR/platforms/ios)
- App Node para Android: [App Android](/pt-BR/platforms/android)
- Status do Windows: [Windows (WSL2)](/pt-BR/platforms/windows)
- Status do Linux: [App Linux](/pt-BR/platforms/linux)
- Segurança: [Segurança](/pt-BR/gateway/security)

## Relacionado

- [Introdução](/pt-BR/start/getting-started)
- [Configuração](/pt-BR/start/setup)
- [Visão geral dos canais](/pt-BR/channels)
