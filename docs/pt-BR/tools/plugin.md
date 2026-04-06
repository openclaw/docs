---
read_when:
    - Instalar ou configurar plugins
    - Entender as regras de descoberta e carregamento de plugins
    - Trabalhar com pacotes de plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-06T03:13:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e2472a3023f3c1c6ee05b0cdc228f6b713cc226a08695b327de8a3ad6973c83
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins estendem o OpenClaw com novas capabilities: canais, provedores de model,
tools, Skills, fala, transcrição em tempo real, voz em tempo real,
compreensão de mídia, geração de imagens, geração de vídeo, web fetch, web
search e muito mais. Alguns plugins são **core** (incluídos no OpenClaw), outros
são **externos** (publicados no npm pela comunidade).

## Início rápido

<Steps>
  <Step title="Veja o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instale um plugin">
    ```bash
    # Do npm
    openclaw plugins install @openclaw/voice-call

    # De um diretório ou arquivo local
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Em seguida, configure em `plugins.entries.\<id\>.config` no seu arquivo de config.

  </Step>
</Steps>

Se você preferir controle nativo por chat, ative `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, 
`clawhub:<pkg>` explícito ou especificação simples de pacote (ClawHub primeiro, depois fallback para npm).

Se a config for inválida, a instalação normalmente falha de forma fechada e direciona você para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho estreito de reinstalação de plugin incluído
para plugins que fazem opt-in em
`openclaw.install.allowInvalidConfigRecovery`.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato    | Como funciona                                                   | Exemplos                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo de runtime; executa em processo  | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um plugin Native, comece com [Building Plugins](/pt-BR/plugins/building-plugins)
e [Plugin SDK Overview](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Pacote                | Documentação                        |
| --------------- | --------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/pt-BR/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/pt-BR/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pt-BR/plugins/voice-call)  |
| Zalo            | `@openclaw/zalo`      | [Zalo](/pt-BR/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/pt-BR/plugins/zalouser)  |

### Core (incluídos no OpenClaw)

<AccordionGroup>
  <Accordion title="Provedores de model (ativados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — memory search incluída (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda, auto-recall/capture (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provedores de fala (ativados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — plugin de browser incluído para a tool de browser, a CLI `openclaw browser`, o método de gateway `browser.request`, o runtime de browser e o serviço padrão de controle de browser (ativado por padrão; desative antes de substituí-lo)
    - `copilot-proxy` — bridge local do VS Code Copilot Proxy (desativada por padrão)
  </Accordion>
</AccordionGroup>

Procurando plugins de terceiros? Consulte [Community Plugins](/pt-BR/plugins/community).

## Configuração

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo            | Descrição                                              |
| ---------------- | ------------------------------------------------------ |
| `enabled`        | Chave mestre (padrão: `true`)                          |
| `allow`          | Allowlist de plugins (opcional)                        |
| `deny`           | Denylist de plugins (opcional; deny vence)             |
| `load.paths`     | Arquivos/diretórios extras de plugin                   |
| `slots`          | Seletores de slot exclusivos (por exemplo `memory`, `contextEngine`) |
| `entries.\<id\>` | Chaves + config por plugin                             |

Mudanças de config **exigem reinício do gateway**. Se o Gateway estiver em execução com
watch de config + reinício em processo ativado (o caminho padrão `openclaw gateway`),
esse reinício normalmente é executado automaticamente logo após a gravação da config.

<Accordion title="Estados do plugin: disabled vs missing vs invalid">
  - **Disabled**: o plugin existe, mas regras de ativação o desligaram. A config é preservada.
  - **Missing**: a config referencia um id de plugin que a descoberta não encontrou.
  - **Invalid**: o plugin existe, mas sua config não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw procura plugins nesta ordem (a primeira correspondência vence):

<Steps>
  <Step title="Caminhos de config">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório.
  </Step>

  <Step title="Extensões do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensões globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluídos">
    Incluídos no OpenClaw. Muitos são ativados por padrão (provedores de model, fala).
    Outros exigem ativação explícita.
  </Step>
</Steps>

### Regras de ativação

- `plugins.enabled: false` desativa todos os plugins
- `plugins.deny` sempre vence sobre allow
- `plugins.entries.\<id\>.enabled: false` desativa esse plugin
- Plugins originados do workspace ficam **desativados por padrão** (devem ser ativados explicitamente)
- Plugins incluídos seguem o conjunto interno ativado por padrão, salvo sobrescrita
- Slots exclusivos podem forçar a ativação do plugin selecionado para esse slot

## Slots de plugin (categorias exclusivas)

Algumas categorias são exclusivas (somente uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desativar
      contextEngine: "legacy", // ou um id de plugin
    },
  },
}
```

| Slot            | O que controla           | Padrão              |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Plugin de memória ativo  | `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (integrado) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas plugins carregados
openclaw plugins list --verbose            # linhas detalhadas por plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instala (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instala somente do ClawHub
openclaw plugins install <spec> --force    # sobrescreve instalação existente
openclaw plugins install <path>            # instala de caminho local
openclaw plugins install -l <path>         # linka (sem copiar) para dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra a especificação npm exata resolvida
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # atualiza um plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualiza todos
openclaw plugins uninstall <id>          # remove registros de config/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins incluídos vêm com o OpenClaw. Muitos são ativados por padrão (por exemplo
provedores de model incluídos, provedores de fala incluídos e o plugin de browser
incluído). Outros plugins incluídos ainda exigem `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin instalado existente ou um pacote de hooks no local.
Não é compatível com `--link`, que reutiliza o caminho de origem em vez de
copiar para um destino de instalação gerenciado.

`--pin` é somente para npm. Não é compatível com `--marketplace`, porque
instalações via marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma sobrescrita de último recurso para falsos
positivos do scanner integrado de código perigoso. Ele permite que instalações
e atualizações de plugins prossigam mesmo diante de achados integrados `critical`, mas ainda
não contorna bloqueios de política `before_install` de plugin nem o bloqueio por falha de scan.

Essa flag da CLI se aplica apenas aos fluxos de instalação/atualização de plugins. Instalações de dependência de Skills com suporte do Gateway
usam, em vez disso, a sobrescrita correspondente de requisição `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skills do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable de plugins. O suporte atual de runtime inclui bundle Skills, command-Skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` e `lspServers` declarados em manifesto do Claude,
command-Skills do Cursor e diretórios de hook compatíveis do Codex.

`openclaw plugins inspect <id>` também informa capabilities de bundle detectadas, além de entradas de servidor MCP e LSP compatíveis ou não compatíveis para plugins baseados em bundle.

As origens de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz local de marketplace ou caminho
`marketplace.json`, um atalho GitHub como `owner/repo`, uma URL de repositório do GitHub,
ou uma URL git. Para marketplaces remotos, as entradas de plugin devem permanecer dentro do
repositório clonado do marketplace e usar apenas origens de caminho relativo.

Consulte [referência da CLI `openclaw plugins`](/cli/plugins) para detalhes completos.

## Visão geral da API de plugin

Plugins Native exportam um objeto de entrada que expõe `register(api)`. Plugins mais antigos
ainda podem usar `activate(api)` como alias legado, mas plugins novos devem
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
ativação do plugin. O loader ainda usa `activate(api)` como fallback para plugins antigos,
mas plugins incluídos e novos plugins externos devem tratar `register` como o
contrato público.

Métodos comuns de registro:

| Método                                  | O que registra              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de model (LLM)     |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Tool de agente              |
| `registerHook` / `on(...)`              | Hooks de lifecycle          |
| `registerSpeechProvider`                | Texto para fala / STT       |
| `registerRealtimeTranscriptionProvider` | STT streaming               |
| `registerRealtimeVoiceProvider`         | Voz duplex em tempo real    |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio     |
| `registerImageGenerationProvider`       | Geração de imagens          |
| `registerMusicGenerationProvider`       | Geração de música           |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provedor de web fetch / scrape |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos da CLI             |
| `registerContextEngine`                 | Mecanismo de contexto       |
| `registerService`                       | Serviço em segundo plano    |

Comportamento de guard de hooks de lifecycle tipados:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade inferior são ignorados.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade inferior são ignorados.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade inferior são ignorados.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Para o comportamento completo de hooks tipados, consulte [SDK Overview](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Building Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Plugin Bundles](/pt-BR/plugins/bundles) — compatibilidade com bundles de Codex/Claude/Cursor
- [Plugin Manifest](/pt-BR/plugins/manifest) — schema de manifesto
- [Registering Tools](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione tools de agente em um plugin
- [Plugin Internals](/pt-BR/plugins/architecture) — modelo de capability e pipeline de carregamento
- [Community Plugins](/pt-BR/plugins/community) — listagens de terceiros
