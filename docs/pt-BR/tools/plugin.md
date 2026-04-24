---
read_when:
    - Instalando ou configurando plugins
    - Entendendo as regras de descoberta e carregamento de Plugins
    - Trabalhando com bundles de Plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie Plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-24T06:17:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2cf5cb6146ae5e52a32201ee08c03211dbea2313b884c696307abc56d3f9cbf
    source_path: tools/plugin.md
    workflow: 15
---

Os Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
compreensão de mídia, geração de imagem, geração de vídeo, web fetch, web
search e mais. Alguns Plugins são **core** (enviados com o OpenClaw), outros
são **externos** (publicados no npm pela comunidade).

## Início rápido

<Steps>
  <Step title="Ver o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar um Plugin">
    ```bash
    # Do npm
    openclaw plugins install @openclaw/voice-call

    # De um diretório local ou arquivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Depois configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>
</Steps>

Se você preferir controle nativo por chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>`
explícito ou especificação simples de pacote (ClawHub primeiro, depois fallback para npm).

Se a configuração estiver inválida, a instalação normalmente falha de forma segura e aponta você para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de reinstalação de Plugin empacotado
para Plugins que aderem a
`openclaw.install.allowInvalidConfigRecovery`.

Instalações empacotadas do OpenClaw não instalam antecipadamente toda a árvore de dependências
de runtime de cada Plugin empacotado. Quando um Plugin empacotado de propriedade do OpenClaw está ativo a partir da
configuração de plugin, configuração legada de canal ou um manifesto habilitado por padrão, a inicialização
repara apenas as dependências de runtime declaradas desse Plugin antes de importá-lo.
Plugins externos e caminhos de carregamento personalizados ainda precisam ser instalados por meio de
`openclaw plugins install`.

## Tipos de Plugin

O OpenClaw reconhece dois formatos de Plugin:

| Formato    | Como funciona                                                  | Exemplos                                               |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa in-process | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um Plugin nativo, comece com [Building Plugins](/pt-BR/plugins/building-plugins)
e [Plugin SDK Overview](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Pacote                | Documentação                        |
| --------------- | --------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/pt-BR/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/pt-BR/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pt-BR/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/pt-BR/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/pt-BR/plugins/zalouser)  |

### Core (enviados com o OpenClaw)

<AccordionGroup>
  <Accordion title="Provedores de modelo (habilitados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — busca de memória empacotada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com auto-recall/capture instalada sob demanda (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — Plugin de browser empacotado para a ferramenta de browser, CLI `openclaw browser`, método de gateway `browser.request`, runtime de browser e serviço padrão de controle de browser (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — bridge do VS Code Copilot Proxy (desabilitado por padrão)
  </Accordion>
</AccordionGroup>

Procurando Plugins de terceiros? Consulte [Community Plugins](/pt-BR/plugins/community).

## Configuração

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo           | Descrição                                                 |
| --------------- | --------------------------------------------------------- |
| `enabled`       | Alternância principal (padrão: `true`)                    |
| `allow`         | Allowlist de Plugins (opcional)                           |
| `deny`          | Denylist de Plugins (opcional; deny vence)                |
| `load.paths`    | Arquivos/diretórios extras de Plugin                      |
| `slots`         | Seletores de slot exclusivos (por exemplo `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por Plugin                    |

Mudanças de configuração **exigem reinício do gateway**. Se o Gateway estiver em execução com config
watch + reinício in-process habilitados (o caminho padrão `openclaw gateway`), esse
reinício normalmente é realizado automaticamente pouco depois de a gravação da configuração ser concluída.

<Accordion title="Estados do Plugin: desabilitado vs ausente vs inválido">
  - **Desabilitado**: o Plugin existe, mas regras de habilitação o desativaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de Plugin que a descoberta não encontrou.
  - **Inválido**: o Plugin existe, mas sua configuração não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw procura Plugins nesta ordem (a primeira correspondência vence):

<Steps>
  <Step title="Caminhos da configuração">
    `plugins.load.paths` — caminhos explícitos para arquivo ou diretório.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins empacotados">
    Enviados com o OpenClaw. Muitos são habilitados por padrão (provedores de modelo, fala).
    Outros exigem habilitação explícita.
  </Step>
</Steps>

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os Plugins
- `plugins.deny` sempre vence sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse Plugin
- Plugins de origem no workspace ficam **desabilitados por padrão** (devem ser habilitados explicitamente)
- Plugins empacotados seguem o conjunto interno habilitado por padrão, a menos que sejam sobrescritos
- Slots exclusivos podem forçar a habilitação do Plugin selecionado para aquele slot

## Slots de Plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desabilitar
      contextEngine: "legacy", // ou um id de Plugin
    },
  },
}
```

| Slot            | O que ele controla    | Padrão              |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de Active Memory | `memory-core`     |
| `contextEngine` | Engine de contexto ativa | `legacy` (integrado) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas Plugins carregados
openclaw plugins list --verbose            # linhas de detalhes por Plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instala (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instala apenas do ClawHub
openclaw plugins install <spec> --force    # sobrescreve instalação existente
openclaw plugins install <path>            # instala de caminho local
openclaw plugins install -l <path>         # linka (sem copiar) para desenvolvimento
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra a spec exata resolvida do npm
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # atualiza um Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualiza todos
openclaw plugins uninstall <id>          # remove registros de configuração/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins empacotados são enviados com o OpenClaw. Muitos são habilitados por padrão (por exemplo,
provedores de modelo empacotados, provedores de fala empacotados e o Plugin
de browser empacotado). Outros Plugins empacotados ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um Plugin instalado existente ou hook pack no lugar. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de Plugins npm
rastreados. Isso não é compatível com `--link`, que reutiliza o caminho-fonte em vez
de copiar para um destino de instalação gerenciado.

Quando `plugins.allow` já estiver definido, `openclaw plugins install` adiciona o
id do Plugin instalado a essa allowlist antes de habilitá-lo, para que instalações fiquem
imediatamente carregáveis após o reinício.

`openclaw plugins update <id-or-npm-spec>` aplica-se a instalações rastreadas. Passar
uma spec de pacote npm com um dist-tag ou versão exata resolve o nome do pacote
de volta para o registro rastreado do Plugin e registra a nova spec para atualizações futuras.
Passar o nome do pacote sem versão move uma instalação exata fixada de volta para
a linha de release padrão do registro. Se o Plugin npm instalado já corresponder
à versão resolvida e à identidade de artifact registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou regravar a configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações via marketplace persistem metadados da origem do marketplace em vez de uma spec npm.

`--dangerously-force-unsafe-install` é uma sobrescrita de emergência para falsos
positivos do scanner integrado de código perigoso. Ele permite que instalações
e atualizações de Plugin continuem apesar de achados `critical` integrados, mas ainda
não contorna bloqueios de política `before_install` do Plugin nem bloqueio por falha de varredura.

Esta flag da CLI se aplica apenas a fluxos de instalação/atualização de Plugin. Instalações
de dependência de Skills com suporte do Gateway usam em vez disso a sobrescrita de request correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skills do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable de Plugin. O suporte atual de runtime inclui bundle Skills, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` e `lspServers`
declarados no manifesto do Claude, command-skills do Cursor e diretórios de hooks
compatíveis do Codex.

`openclaw plugins inspect <id>` também informa recursos detectados do bundle, além de entradas
MCP e LSP server compatíveis ou não compatíveis para Plugins baseados em bundle.

As fontes de marketplace podem ser um nome de marketplace conhecido do Claude de
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou
caminho `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório
do GitHub ou uma URL git. Para marketplaces remotos, as entradas de Plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas fontes de caminho relativo.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para todos os detalhes.

## Visão geral da API de Plugin

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins
mais antigos ainda podem usar `activate(api)` como alias legado, mas novos Plugins devem
usar `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

O OpenClaw carrega o objeto de entrada e chama `register(api)` durante a
ativação do Plugin. O carregador ainda usa fallback para `activate(api)` em Plugins mais antigos,
mas Plugins empacotados e novos Plugins externos devem tratar `register` como o contrato público.

Métodos comuns de registro:

| Método                                  | O que ele registra          |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)    |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Ferramenta do agente        |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida      |
| `registerSpeechProvider`                | Texto para fala / STT       |
| `registerRealtimeTranscriptionProvider` | STT em streaming            |
| `registerRealtimeVoiceProvider`         | Voz duplex em tempo real    |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio     |
| `registerImageGenerationProvider`       | Geração de imagem           |
| `registerMusicGenerationProvider`       | Geração de música           |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provedor de web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos CLI                |
| `registerContextEngine`                 | Engine de contexto          |
| `registerService`                       | Serviço em background       |

Comportamento de guard de hook para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_install`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não limpa um cancelamento anterior.

Para o comportamento completo de hooks tipados, consulte [SDK Overview](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Building Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio Plugin
- [Plugin Bundles](/pt-BR/plugins/bundles) — compatibilidade de bundle com Codex/Claude/Cursor
- [Plugin Manifest](/pt-BR/plugins/manifest) — schema do manifesto
- [Registering Tools](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas do agente em um Plugin
- [Plugin Internals](/pt-BR/plugins/architecture) — modelo de capacidade e pipeline de carregamento
- [Community Plugins](/pt-BR/plugins/community) — listagens de terceiros
