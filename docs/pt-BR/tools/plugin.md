---
read_when:
    - Instalando ou configurando plugins
    - Entendendo as regras de descoberta e carregamento de plugins
    - Trabalhando com bundles de plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T14:08:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins estendem o OpenClaw com novos recursos: canais, providers de modelo,
ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
entendimento de mídia, geração de imagem, geração de vídeo, web fetch, busca na web
e mais. Alguns plugins são **core** (entregues com o OpenClaw), outros
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

    # De um diretório local ou arquivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Depois configure em `plugins.entries.\<id\>.config` no seu arquivo de config.

  </Step>
</Steps>

Se você preferir controle nativo por chat, ative `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>` explícito, ou especificação de pacote sem prefixo (ClawHub primeiro, depois fallback para npm).

Se a config for inválida, a instalação normalmente falha de forma fechada e aponta você para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de
reinstalação de plugin incluído no pacote para plugins que fazem opt-in para
`openclaw.install.allowInvalidConfigRecovery`.

Instalações empacotadas do OpenClaw não instalam de forma antecipada toda a
árvore de dependências de runtime de cada plugin incluído no pacote. Quando um plugin
incluído e pertencente ao OpenClaw está ativo a partir da config de plugin, config legada de
canal ou um manifesto ativado por padrão, a inicialização repara apenas as dependências de runtime declaradas desse plugin antes de importá-lo.
Plugins externos e caminhos de carregamento personalizados ainda precisam ser instalados por
`openclaw plugins install`.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato    | Como funciona                                                     | Exemplos                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa in-process    | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um plugin nativo, comece com [Criando Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Pacote                | Docs                                 |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/pt-BR/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/pt-BR/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pt-BR/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/pt-BR/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/pt-BR/plugins/zalouser)   |

### Core (entregues com o OpenClaw)

<AccordionGroup>
  <Accordion title="Providers de modelo (ativados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — busca de memória incluída no pacote (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda, auto-recall/capture (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Providers de fala (ativados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — plugin de navegador incluído no pacote para a ferramenta de navegador, CLI `openclaw browser`, método `browser.request` do gateway, runtime de navegador e serviço padrão de controle do navegador (ativado por padrão; desative antes de substituí-lo)
    - `copilot-proxy` — ponte do VS Code Copilot Proxy (desativado por padrão)
  </Accordion>
</AccordionGroup>

Procurando plugins de terceiros? Consulte [Plugins da comunidade](/pt-BR/plugins/community).

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
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Chave principal (padrão: `true`)                          |
| `allow`          | Allowlist de plugin (opcional)                            |
| `deny`           | Denylist de plugin (opcional; deny vence)                 |
| `load.paths`     | Arquivos/diretórios extras de plugin                      |
| `slots`          | Seletores de slot exclusivos (por exemplo `memory`, `contextEngine`) |
| `entries.\<id\>` | Chaves + config por plugin                                |

Mudanças de config **exigem reinício do gateway**. Se o Gateway estiver executando com
watch de config + reinício in-process ativado (o caminho padrão `openclaw gateway`), esse
reinício normalmente é realizado automaticamente pouco depois de a gravação da config acontecer.

<Accordion title="Estados do plugin: desativado vs ausente vs inválido">
  - **Desativado**: o plugin existe, mas as regras de ativação o desligaram. A config é preservada.
  - **Ausente**: a config faz referência a um ID de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua config não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw procura plugins nesta ordem (a primeira correspondência vence):

<Steps>
  <Step title="Caminhos de config">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluídos no pacote">
    Entregues com o OpenClaw. Muitos são ativados por padrão (providers de modelo, fala).
    Outros exigem ativação explícita.
  </Step>
</Steps>

### Regras de ativação

- `plugins.enabled: false` desativa todos os plugins
- `plugins.deny` sempre vence `allow`
- `plugins.entries.\<id\>.enabled: false` desativa esse plugin
- Plugins originados do workspace ficam **desativados por padrão** (devem ser ativados explicitamente)
- Plugins incluídos no pacote seguem o conjunto embutido ativado por padrão, salvo sobrescrita
- Slots exclusivos podem forçar a ativação do plugin selecionado para esse slot

## Slots de plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desativar
      contextEngine: "legacy", // ou um ID de plugin
    },
  },
}
```

| Slot            | O que controla              | Padrão             |
| --------------- | --------------------------- | ------------------ |
| `memory`        | Plugin de memória ativo     | `memory-core`      |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (embutido) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas plugins carregados
openclaw plugins list --verbose            # linhas de detalhe por plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes profundos
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instala (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instala somente do ClawHub
openclaw plugins install <spec> --force    # sobrescreve instalação existente
openclaw plugins install <path>            # instala de caminho local
openclaw plugins install -l <path>         # linka (sem cópia) para desenvolvimento
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra a especificação npm exata resolvida
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # atualiza um plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualiza todos
openclaw plugins uninstall <id>          # remove registros de config/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins incluídos no pacote vêm com o OpenClaw. Muitos são ativados por padrão (por exemplo
providers de modelo incluídos no pacote, providers de fala incluídos no pacote e o plugin
de navegador incluído no pacote). Outros plugins incluídos no pacote ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin ou hook pack instalado existente no local. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de plugins npm rastreados.
Não é compatível com `--link`, que reutiliza o caminho de origem em vez de
copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
ID do plugin instalado a essa allowlist antes de ativá-lo, então as instalações ficam
imediatamente carregáveis após o reinício.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro do plugin rastreado e registra a nova especificação para futuras atualizações.
Passar o nome do pacote sem versão move uma instalação exata fixada de volta para
a linha de lançamento padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar nem regravar config.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações via marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma sobrescrita de emergência para falsos
positivos do scanner embutido de código perigoso. Ele permite que instalações
e atualizações de plugins prossigam apesar de achados embutidos `critical`, mas ainda
não ignora bloqueios de política `before_install` do plugin nem bloqueio por falha de varredura.

Essa flag da CLI se aplica apenas a fluxos de instalação/atualização de plugin. Instalações
de dependência de Skills com suporte do Gateway usam a sobrescrita correspondente de requisição
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skills do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable de plugins.
O suporte atual de runtime inclui Skills de bundle, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` e `lspServers`
declarados por manifesto do Claude, command-skills do Cursor e diretórios de hooks do Codex compatíveis.

`openclaw plugins inspect <id>` também informa recursos de bundle detectados, além de entradas
de servidor MCP e LSP compatíveis ou não compatíveis para plugins baseados em bundle.

Fontes de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou
caminho `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. Para marketplaces remotos, entradas de plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas fontes de caminho relativo.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de Plugin

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins mais antigos
ainda podem usar `activate(api)` como alias legado, mas novos plugins devem
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
ativação do plugin. O carregador ainda usa fallback para `activate(api)` em plugins mais antigos,
mas plugins incluídos no pacote e novos plugins externos devem tratar `register` como o contrato público.

Métodos comuns de registro:

| Método                                  | O que registra               |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Provider de modelo (LLM)     |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Ferramenta de agente         |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida       |
| `registerSpeechProvider`                | Texto para fala / STT        |
| `registerRealtimeTranscriptionProvider` | STT de streaming             |
| `registerRealtimeVoiceProvider`         | Voz em tempo real bidirecional |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio      |
| `registerImageGenerationProvider`       | Geração de imagem            |
| `registerMusicGenerationProvider`       | Geração de música            |
| `registerVideoGenerationProvider`       | Geração de vídeo             |
| `registerWebFetchProvider`              | Provider de web fetch / scrape |
| `registerWebSearchProvider`             | Busca na web                 |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandos de CLI              |
| `registerContextEngine`                 | Mecanismo de contexto        |
| `registerService`                       | Serviço em segundo plano     |

Comportamento de proteção de hook para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de menor prioridade são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de menor prioridade são ignorados.
- `before_install`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de menor prioridade são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não limpa um cancelamento anterior.

Para o comportamento completo de hooks tipados, consulte [Visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Plugin Bundles](/pt-BR/plugins/bundles) — compatibilidade com bundles de Codex/Claude/Cursor
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema do manifesto
- [Registrando ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um plugin
- [Internals de Plugin](/pt-BR/plugins/architecture) — modelo de recursos e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
