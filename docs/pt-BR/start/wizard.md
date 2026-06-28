---
read_when:
    - Executar ou configurar a integração inicial pela CLI
    - Configurando uma nova máquina
sidebarTitle: 'Onboarding: CLI'
summary: 'Integração da CLI: configuração guiada para Gateway, espaço de trabalho, canais e Skills'
title: Integração inicial (CLI)
x-i18n:
    generated_at: "2026-06-28T20:45:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

A integração inicial pela CLI é o caminho de configuração pelo terminal **recomendado** para o OpenClaw no
macOS, Linux ou Windows. Usuários do desktop Windows também podem começar com o
[Hub do Windows](/pt-BR/platforms/windows).
Ela configura um Gateway local ou uma conexão com Gateway remoto, além de canais, Skills
e padrões de workspace em um único fluxo guiado.

```bash
openclaw onboard
```

O Início Rápido geralmente leva apenas alguns minutos, mas a integração inicial completa pode levar mais tempo
quando login em provedor, pareamento de canal, instalação de daemon, downloads de rede,
Skills ou Plugins opcionais exigem configuração extra. O assistente mostra esse cronograma
inicialmente, e etapas opcionais podem ser puladas e revisitadas depois com
`openclaw configure`.

## Localidade

O assistente da CLI localiza os textos fixos da integração inicial. Ele resolve a localidade a partir de
`OPENCLAW_LOCALE`, depois `LC_ALL`, depois `LC_MESSAGES`, depois `LANG`, e usa
inglês como fallback. As localidades compatíveis do assistente são `en`, `zh-CN` e `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nomes e identificadores estáveis permanecem literais: `OpenClaw`, `Gateway`, `Tailscale`,
comandos, chaves de configuração, URLs, IDs de provedor, IDs de modelo e rótulos de Plugin/canal
não são traduzidos.

<Info>
Primeiro chat mais rápido: abra a Interface de Controle (sem necessidade de configurar canal). Execute
`openclaw dashboard` e converse no navegador. Documentação: [Painel](/pt-BR/web/dashboard).
</Info>

Para reconfigurar depois:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` não implica modo não interativo. Para scripts, use `--non-interactive`.
</Note>

<Tip>
A integração inicial pela CLI inclui uma etapa de busca na web em que você pode escolher um provedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Alguns provedores exigem uma
chave de API, enquanto outros não precisam de chave. Você também pode configurar isso depois com
`openclaw configure --section web`. Documentação: [Ferramentas web](/pt-BR/tools/web).
</Tip>

## Início Rápido vs Avançado

A integração inicial começa com **Início Rápido** (padrões) vs **Avançado** (controle total).

<Tabs>
  <Tab title="Início Rápido (padrões)">
    - Gateway local (loopback)
    - Padrão de workspace (ou workspace existente)
    - Porta do Gateway **18789**
    - Autenticação do Gateway **Token** (gerado automaticamente, mesmo em loopback)
    - Padrão de política de ferramentas para novas configurações locais: `tools.profile: "coding"` (o perfil explícito existente é preservado)
    - Padrão de isolamento de DM: a integração inicial local grava `session.dmScope: "per-channel-peer"` quando não definido. Detalhes: [Referência de Configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals)
    - Exposição por Tailscale **Desativada**
    - DMs do Telegram + WhatsApp usam **lista de permissões** por padrão (você receberá uma solicitação para informar seu número de telefone)

  </Tab>
  <Tab title="Avançado (controle total)">
    - Expõe todas as etapas (modo, workspace, Gateway, canais, daemon, Skills).

  </Tab>
</Tabs>

## O que a integração inicial configura

O **modo local (padrão)** orienta você por estas etapas:

1. **Modelo/Auth** — escolha qualquer provedor/fluxo de autenticação compatível (chave de API, OAuth ou autenticação manual específica do provedor), incluindo Provedor Personalizado
   (compatível com OpenAI, compatível com Anthropic ou detecção automática Desconhecida). Escolha um modelo padrão.
   Nota de segurança: se este agente executará ferramentas ou processará conteúdo de webhook/hooks, prefira o modelo de geração mais recente e mais forte disponível e mantenha a política de ferramentas rigorosa. Camadas mais fracas/antigas são mais fáceis de sofrer injeção de prompt.
   Para execuções não interativas, `--secret-input-mode ref` armazena refs baseadas em env nos perfis de autenticação em vez de valores de chave de API em texto puro.
   No modo `ref` não interativo, a variável de ambiente do provedor deve estar definida; passar flags de chave inline sem essa variável de ambiente falha rapidamente.
   Em execuções interativas, escolher o modo de referência de segredo permite apontar para uma variável de ambiente ou uma ref de provedor configurada (`file` ou `exec`), com uma validação preflight rápida antes de salvar.
   Para Anthropic, a integração inicial/configuração interativa oferece **Anthropic Claude CLI** como o caminho local preferido e **chave de API da Anthropic** como o caminho de produção recomendado. Anthropic setup-token também permanece disponível como um caminho de autenticação por token compatível.
2. **Workspace** — Localização dos arquivos do agente (padrão `~/.openclaw/workspace`). Semeia arquivos de bootstrap.
3. **Gateway** — Porta, endereço de bind, modo de autenticação, exposição por Tailscale.
   No modo de token interativo, escolha armazenamento padrão de token em texto puro ou opte por SecretRef.
   Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** — canais de chat integrados e de Plugins oficiais, como iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e mais.
5. **Daemon** — Instala um LaunchAgent (macOS), unidade de usuário systemd (Linux/WSL2) ou Windows Scheduled Task nativa com fallback por usuário na pasta Startup.
   Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o validará, mas não persistirá o token resolvido nos metadados de ambiente do serviço supervisor.
   Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, a instalação do daemon será bloqueada com orientação acionável.
   Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
6. **Verificação de integridade** — Inicia o Gateway e verifica se ele está em execução.
7. **Skills** — Instala Skills recomendadas e dependências opcionais.

<Note>
Executar a integração inicial novamente **não** apaga nada, a menos que você escolha explicitamente **Redefinir** (ou passe `--reset`).
A CLI `--reset` redefine por padrão configuração, credenciais e sessões; use `--reset-scope full` para incluir o workspace.
Se a configuração for inválida ou contiver chaves legadas, a integração inicial solicitará que você execute `openclaw doctor` primeiro.
</Note>

O **modo remoto** configura apenas o cliente local para se conectar a um Gateway em outro lugar.
Ele **não** instala nem altera nada no host remoto.

## Adicionar outro agente

Use `openclaw agents add <name>` para criar um agente separado com seu próprio workspace,
sessões e perfis de autenticação. Executar sem `--workspace` inicia a integração inicial.

O que ele define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Observações:

- Workspaces padrão seguem `~/.openclaw/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens recebidas (a integração inicial pode fazer isso).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para detalhamentos passo a passo e saídas de configuração, consulte
[Referência de Configuração da CLI](/pt-BR/start/wizard-cli-reference).
Para exemplos não interativos, consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation).
Para a referência técnica mais aprofundada, incluindo detalhes de RPC, consulte
[Referência de Integração Inicial](/pt-BR/reference/wizard).

## Documentos relacionados

- Referência de comandos da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)
- Visão geral da integração inicial: [Visão Geral da Integração Inicial](/pt-BR/start/onboarding-overview)
- Integração inicial do app macOS: [Integração Inicial](/pt-BR/start/onboarding)
- Ritual de primeira execução do agente: [Bootstrap do Agente](/pt-BR/start/bootstrapping)
