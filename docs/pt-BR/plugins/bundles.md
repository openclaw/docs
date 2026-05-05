---
read_when:
    - Você quer instalar um pacote compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do pacote para recursos nativos
    - Você está depurando a detecção de pacotes ou capacidades ausentes
summary: Instale e use pacotes do Codex, Claude e Cursor como plugins do OpenClaw
title: Pacotes de Plugin
x-i18n:
    generated_at: "2026-05-05T01:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw pode instalar plugins de três ecossistemas externos: **Codex**, **Claude**,
e **Cursor**. Eles são chamados de **pacotes** — pacotes de conteúdo e metadados que
o OpenClaw mapeia para recursos nativos como Skills, hooks e ferramentas MCP.

<Info>
  Pacotes **não** são a mesma coisa que plugins nativos do OpenClaw. Plugins nativos rodam
  no processo e podem registrar qualquer capacidade. Pacotes são conjuntos de conteúdo com
  mapeamento seletivo de recursos e um limite de confiança mais restrito.
</Info>

## Por que os pacotes existem

Muitos plugins úteis são publicados no formato Codex, Claude ou Cursor. Em vez
de exigir que autores os reescrevam como plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia o conteúdo compatível para o conjunto de recursos
nativo. Isso significa que você pode instalar um pacote de comandos Claude ou um pacote de Skills do Codex
e usá-lo imediatamente.

## Instalar um pacote

<Steps>
  <Step title="Instalar de um diretório, arquivo ou marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verificar detecção">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Pacotes aparecem como `Format: bundle` com um subtipo `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Reiniciar e usar">
    ```bash
    openclaw gateway restart
    ```

    Recursos mapeados (Skills, hooks, ferramentas MCP, padrões LSP) ficam disponíveis na próxima sessão.

  </Step>
</Steps>

## O que o OpenClaw mapeia de pacotes

Nem todos os recursos de pacote rodam no OpenClaw hoje. Veja o que funciona e o que
é detectado, mas ainda não está conectado.

### Com suporte agora

| Recurso       | Como é mapeado                                                                                 | Aplica-se a     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Conteúdo de Skill | Raízes de Skills do pacote carregam como Skills normais do OpenClaw                                           | Todos os formatos    |
| Comandos      | `commands/` e `.cursor/commands/` tratados como raízes de Skills                                  | Claude, Cursor |
| Pacotes de hooks    | Layouts no estilo OpenClaw com `HOOK.md` + `handler.ts`                                             | Codex          |
| Ferramentas MCP     | Configuração MCP do pacote mesclada nas configurações embarcadas do Pi; servidores stdio e HTTP compatíveis carregados | Todos os formatos    |
| Servidores LSP   | `.lsp.json` do Claude e `lspServers` declarados no manifesto mesclados aos padrões LSP embarcados do Pi  | Claude         |
| Configurações      | `settings.json` do Claude importado como padrões embarcados do Pi                                     | Claude         |

#### Conteúdo de Skill

- raízes de Skills do pacote carregam como raízes de Skills normais do OpenClaw
- raízes `commands` do Claude são tratadas como raízes de Skills adicionais
- raízes `.cursor/commands` do Cursor são tratadas como raízes de Skills adicionais

Isso significa que arquivos de comando Markdown do Claude funcionam pelo carregador
normal de Skills do OpenClaw. Markdown de comandos do Cursor funciona pelo mesmo caminho.

#### Pacotes de hooks

- raízes de hooks de pacote funcionam **somente** quando usam o layout normal de pacote de hooks
  do OpenClaw. Hoje, esse é principalmente o caso compatível com Codex:
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP para Pi

- pacotes habilitados podem contribuir configuração de servidor MCP
- o OpenClaw mescla a configuração MCP do pacote nas configurações embarcadas efetivas do Pi como
  `mcpServers`
- o OpenClaw expõe ferramentas MCP de pacote compatíveis durante turnos do agente Pi embarcado ao
  iniciar servidores stdio ou conectar a servidores HTTP
- os perfis de ferramenta `coding` e `messaging` incluem ferramentas MCP de pacote por
  padrão; use `tools.deny: ["bundle-mcp"]` para optar por não usar em um agente ou Gateway
- configurações locais de projeto do Pi ainda se aplicam depois dos padrões do pacote, então as
  configurações do workspace podem substituir entradas MCP do pacote quando necessário
- catálogos de ferramentas MCP de pacote são ordenados deterministamente antes do registro, para que
  alterações na ordem upstream de `listTools()` não agitem blocos de ferramentas do cache de prompt

##### Transportes

Servidores MCP podem usar transporte stdio ou HTTP:

**Stdio** inicia um processo filho:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** conecta a um servidor MCP em execução por `sse` por padrão, ou `streamable-http` quando solicitado:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` pode ser definido como `"streamable-http"` ou `"sse"`; quando omitido, o OpenClaw usa `sse`
- `type: "http"` é um formato downstream nativo da CLI; use `transport: "streamable-http"` na configuração do OpenClaw. `openclaw mcp set` e `openclaw doctor --fix` normalizam o alias comum.
- somente esquemas de URL `http:` e `https:` são permitidos
- valores de `headers` aceitam interpolação `${ENV_VAR}`
- uma entrada de servidor com `command` e `url` é rejeitada
- credenciais de URL (userinfo e parâmetros de consulta) são redigidas de descrições de ferramentas
  e logs
- `connectionTimeoutMs` substitui o tempo limite de conexão padrão de 30 segundos para
  transportes stdio e HTTP

##### Nomeação de ferramentas

O OpenClaw registra ferramentas MCP de pacote com nomes seguros para provedores no formato
`serverName__toolName`. Por exemplo, um servidor com chave `"vigil-harbor"` que expõe uma ferramenta
`memory_search` é registrado como `vigil-harbor__memory_search`.

- caracteres fora de `A-Za-z0-9_-` são substituídos por `-`
- prefixos de servidor são limitados a 30 caracteres
- nomes completos de ferramentas são limitados a 64 caracteres
- nomes de servidor vazios usam `mcp` como fallback
- nomes sanitizados conflitantes são desambiguados com sufixos numéricos
- a ordem final de ferramentas expostas é determinística por nome seguro para manter turnos repetidos do Pi
  estáveis em cache
- a filtragem de perfis trata todas as ferramentas de um servidor MCP de pacote como pertencentes ao plugin
  `bundle-mcp`, então listas de permissão e negação de perfil podem incluir tanto
  nomes individuais de ferramentas expostas quanto a chave de plugin `bundle-mcp`

#### Configurações embarcadas do Pi

- `settings.json` do Claude é importado como configurações embarcadas padrão do Pi quando o
  pacote está habilitado
- o OpenClaw sanitiza chaves de substituição de shell antes de aplicá-las

Chaves sanitizadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP embarcado do Pi

- pacotes Claude habilitados podem contribuir configuração de servidor LSP
- o OpenClaw carrega `.lsp.json` mais quaisquer caminhos `lspServers` declarados no manifesto
- a configuração LSP do pacote é mesclada aos padrões LSP embarcados efetivos do Pi
- somente servidores LSP com suporte baseados em stdio podem ser executados hoje; transportes
  sem suporte ainda aparecem em `openclaw plugins inspect <id>`

### Detectado, mas não executado

Estes são reconhecidos e exibidos em diagnósticos, mas o OpenClaw não os executa:

- `agents`, automação `hooks.json`, `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` do Cursor
- metadados inline/de app do Codex além do relatório de capacidades

## Formatos de pacote

<AccordionGroup>
  <Accordion title="Pacotes Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pacotes Codex se encaixam melhor no OpenClaw quando usam raízes de Skills e diretórios
    de pacote de hooks no estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pacotes Claude">
    Dois modos de detecção:

    - **Baseado em manifesto:** `.claude-plugin/plugin.json`
    - **Sem manifesto:** layout padrão do Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de Skill
    - `settings.json` é importado para as configurações embarcadas do Pi (chaves de substituição de shell são sanitizadas)
    - `.mcp.json` expõe ferramentas stdio compatíveis ao Pi embarcado
    - `.lsp.json` mais caminhos `lspServers` declarados no manifesto carregam nos padrões LSP embarcados do Pi
    - `hooks/hooks.json` é detectado, mas não executado
    - caminhos de componentes personalizados no manifesto são aditivos (estendem os padrões, não os substituem)

  </Accordion>

  <Accordion title="Pacotes Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` é tratado como conteúdo de Skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` são somente detecção

  </Accordion>
</AccordionGroup>

## Precedência de detecção

O OpenClaw verifica primeiro o formato de plugin nativo:

1. `openclaw.plugin.json` ou `package.json` válido com `openclaw.extensions` — tratado como **plugin nativo**
2. Marcadores de pacote (`.codex-plugin/`, `.claude-plugin/` ou layout padrão do Claude/Cursor) — tratados como **pacote**

Se um diretório contiver ambos, o OpenClaw usa o caminho nativo. Isso evita
que pacotes de formato duplo sejam parcialmente instalados como pacotes.

## Dependências de runtime e limpeza

- Pacotes compatíveis de terceiros não recebem reparo de `npm install` na inicialização. Eles
  devem ser instalados por meio de `openclaw plugins install` e incluir tudo
  de que precisam no diretório de plugin instalado.
- Plugins empacotados pertencentes ao OpenClaw são enviados de forma leve no núcleo ou
  baixáveis pelo instalador de plugins. A inicialização do Gateway nunca executa um
  gerenciador de pacotes para eles.
- `openclaw doctor --fix` remove diretórios legados de dependências preparadas e pode
  recuperar plugins baixáveis ausentes do índice local de plugins quando
  a configuração os referencia.

## Segurança

Pacotes têm um limite de confiança mais restrito que plugins nativos:

- o OpenClaw **não** carrega módulos arbitrários de runtime de pacote no processo
- caminhos de Skills e de pacotes de hooks devem permanecer dentro da raiz do plugin (com verificação de limite)
- arquivos de configuração são lidos com as mesmas verificações de limite
- servidores MCP stdio compatíveis podem ser iniciados como subprocessos

Isso torna pacotes mais seguros por padrão, mas você ainda deve tratar pacotes de terceiros
como conteúdo confiável para os recursos que eles expõem.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O pacote é detectado, mas as capacidades não rodam">
    Execute `openclaw plugins inspect <id>`. Se uma capacidade estiver listada, mas marcada como
    não conectada, isso é um limite do produto — não uma instalação quebrada.
  </Accordion>

  <Accordion title="Arquivos de comando Claude não aparecem">
    Verifique se o pacote está habilitado e se os arquivos Markdown estão dentro de uma raiz
    `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="Configurações do Claude não se aplicam">
    Somente configurações embarcadas do Pi de `settings.json` têm suporte. O OpenClaw não
    trata configurações de pacote como patches de configuração bruta.
  </Accordion>

  <Accordion title="Hooks do Claude não executam">
    `hooks/hooks.json` é somente detecção. Se você precisa de hooks executáveis, use o
    layout de pacote de hooks do OpenClaw ou envie um plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar e configurar plugins](/pt-BR/tools/plugin)
- [Criar plugins](/pt-BR/plugins/building-plugins) — crie um plugin nativo
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — esquema de manifesto nativo
