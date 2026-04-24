---
read_when:
    - Você quer instalar um bundle compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do bundle para recursos nativos
    - Você está depurando detecção de bundle ou capacidades ausentes
summary: Instalar e usar bundles do Codex, Claude e Cursor como plugins do OpenClaw
title: Bundles de Plugin
x-i18n:
    generated_at: "2026-04-24T06:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

O OpenClaw pode instalar plugins de três ecossistemas externos: **Codex**, **Claude**,
e **Cursor**. Eles são chamados de **bundles** — pacotes de conteúdo e metadados que
o OpenClaw mapeia para recursos nativos, como skills, hooks e ferramentas MCP.

<Info>
  Bundles **não** são a mesma coisa que Plugins nativos do OpenClaw. Plugins nativos executam
  in-process e podem registrar qualquer capacidade. Bundles são pacotes de conteúdo com mapeamento seletivo de recursos e um limite de confiança mais restrito.
</Info>

## Por que bundles existem

Muitos plugins úteis são publicados em formato Codex, Claude ou Cursor. Em vez
de exigir que autores os reescrevam como Plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia seu conteúdo compatível para o conjunto nativo de recursos.
Isso significa que você pode instalar um pacote de comandos Claude ou um bundle de skill do Codex
e usá-lo imediatamente.

## Instalar um bundle

<Steps>
  <Step title="Instalar a partir de um diretório, archive ou marketplace">
    ```bash
    # Diretório local
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verificar detecção">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles aparecem como `Format: bundle` com um subtipo `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Reiniciar e usar">
    ```bash
    openclaw gateway restart
    ```

    Recursos mapeados (skills, hooks, ferramentas MCP, padrões de LSP) ficam disponíveis na próxima sessão.

  </Step>
</Steps>

## O que o OpenClaw mapeia a partir de bundles

Nem todo recurso de bundle funciona no OpenClaw hoje. Veja o que funciona e o que
é detectado, mas ainda não está conectado.

### Compatível agora

| Recurso         | Como é mapeado                                                                             | Aplica-se a     |
| --------------- | ------------------------------------------------------------------------------------------ | --------------- |
| Conteúdo de skill | Raízes de skill do bundle são carregadas como Skills normais do OpenClaw                | Todos os formatos |
| Comandos        | `commands/` e `.cursor/commands/` tratados como raízes de skill                            | Claude, Cursor  |
| Pacotes de hook | Layouts no estilo OpenClaw com `HOOK.md` + `handler.ts`                                    | Codex           |
| Ferramentas MCP | Configuração MCP do bundle é mesclada às configurações do Pi incorporado; servidores stdio e HTTP compatíveis são carregados | Todos os formatos |
| Servidores LSP  | `.lsp.json` do Claude e `lspServers` declarados no manifest são mesclados aos padrões de LSP do Pi incorporado | Claude          |
| Settings        | `settings.json` do Claude é importado como padrões do Pi incorporado                       | Claude          |

#### Conteúdo de skill

- raízes de skill de bundle são carregadas como raízes normais de Skill do OpenClaw
- raízes `commands` do Claude são tratadas como raízes adicionais de Skill
- raízes `.cursor/commands` do Cursor são tratadas como raízes adicionais de Skill

Isso significa que arquivos de comando markdown do Claude funcionam pelo carregador normal de Skill do OpenClaw. Markdown de comando do Cursor funciona pelo mesmo caminho.

#### Pacotes de hook

- raízes de hook de bundle funcionam **somente** quando usam o layout normal de pacote de hook do OpenClaw. Hoje isso é principalmente o caso compatível com Codex:
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP para Pi

- bundles habilitados podem contribuir com configuração de servidor MCP
- o OpenClaw mescla a configuração MCP do bundle às configurações efetivas do Pi incorporado como
  `mcpServers`
- o OpenClaw expõe ferramentas MCP de bundle compatíveis durante turnos de agente Pi incorporado iniciando servidores stdio ou conectando-se a servidores HTTP
- os perfis de ferramenta `coding` e `messaging` incluem ferramentas MCP de bundle por padrão; use `tools.deny: ["bundle-mcp"]` para desativar isso para um agente ou gateway
- as configurações locais de projeto do Pi ainda se aplicam após os padrões do bundle, então configurações do workspace podem substituir entradas MCP do bundle quando necessário
- catálogos de ferramentas MCP do bundle são ordenados deterministicamente antes do registro, para que mudanças upstream em `listTools()` não desestabilizem blocos de ferramenta do prompt-cache

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

**HTTP** conecta-se a um servidor MCP em execução via `sse` por padrão, ou `streamable-http` quando solicitado:

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
- apenas esquemas de URL `http:` e `https:` são permitidos
- valores de `headers` oferecem suporte à interpolação `${ENV_VAR}`
- uma entrada de servidor com `command` e `url` ao mesmo tempo é rejeitada
- credenciais de URL (userinfo e parâmetros de query) são redigidas de descrições de ferramentas e logs
- `connectionTimeoutMs` substitui o timeout padrão de 30 segundos para conexão em
  transportes stdio e HTTP

##### Nomenclatura de ferramentas

O OpenClaw registra ferramentas MCP de bundle com nomes seguros para provedores no formato
`serverName__toolName`. Por exemplo, um servidor com chave `"vigil-harbor"` expondo uma
ferramenta `memory_search` é registrado como `vigil-harbor__memory_search`.

- caracteres fora de `A-Za-z0-9_-` são substituídos por `-`
- prefixos de servidor são limitados a 30 caracteres
- nomes completos de ferramenta são limitados a 64 caracteres
- nomes vazios de servidor usam `mcp` como fallback
- nomes sanitizados em colisão são desambiguados com sufixos numéricos
- a ordem final das ferramentas expostas é determinística por nome seguro, para manter estáveis os caches em turnos repetidos do Pi
- a filtragem por perfil trata todas as ferramentas de um servidor MCP de bundle como pertencentes ao Plugin `bundle-mcp`, então allowlists e listas de negação de perfil podem incluir
  nomes individuais de ferramentas expostas ou a chave de Plugin `bundle-mcp`

#### Settings do Pi incorporado

- `settings.json` do Claude é importado como configurações padrão do Pi incorporado quando o
  bundle está habilitado
- o OpenClaw sanitiza chaves de substituição de shell antes de aplicá-las

Chaves sanitizadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP do Pi incorporado

- bundles Claude habilitados podem contribuir com configuração de servidor LSP
- o OpenClaw carrega `.lsp.json` mais quaisquer caminhos `lspServers` declarados no manifest
- a configuração LSP do bundle é mesclada aos padrões efetivos de LSP do Pi incorporado
- hoje, apenas servidores LSP com suporte a stdio são executáveis; transportes não compatíveis ainda aparecem em `openclaw plugins inspect <id>`

### Detectado, mas não executado

Estes são reconhecidos e mostrados em diagnósticos, mas o OpenClaw não os executa:

- `agents`, automação `hooks.json`, `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` do Cursor
- metadados inline/de app do Codex além de relatório de capacidade

## Formatos de bundle

<AccordionGroup>
  <Accordion title="Bundles Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundles Codex se encaixam melhor no OpenClaw quando usam raízes de skill e
    diretórios de pacote de hook no estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles Claude">
    Dois modos de detecção:

    - **Baseado em manifest:** `.claude-plugin/plugin.json`
    - **Sem manifest:** layout padrão do Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de skill
    - `settings.json` é importado para as configurações do Pi incorporado (chaves de substituição de shell são sanitizadas)
    - `.mcp.json` expõe ferramentas stdio compatíveis ao Pi incorporado
    - `.lsp.json` mais caminhos `lspServers` declarados no manifest carregam para os padrões de LSP do Pi incorporado
    - `hooks/hooks.json` é detectado, mas não executado
    - caminhos de componentes personalizados no manifest são aditivos (eles estendem os padrões, não os substituem)

  </Accordion>

  <Accordion title="Bundles Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` é tratado como conteúdo de skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` são apenas detectados

  </Accordion>
</AccordionGroup>

## Precedência de detecção

O OpenClaw verifica primeiro o formato de Plugin nativo:

1. `openclaw.plugin.json` ou `package.json` válido com `openclaw.extensions` — tratado como **Plugin nativo**
2. Marcadores de bundle (`.codex-plugin/`, `.claude-plugin/` ou layout padrão Claude/Cursor) — tratado como **bundle**

Se um diretório contiver ambos, o OpenClaw usa o caminho nativo. Isso evita que
pacotes de formato duplo sejam parcialmente instalados como bundles.

## Dependências de runtime e limpeza

- Dependências de runtime de Plugin incluído são fornecidas dentro do pacote OpenClaw sob
  `dist/*`. O OpenClaw **não** executa `npm install` na inicialização para Plugins
  incluídos; o pipeline de release é responsável por entregar uma carga completa de
  dependências incluídas (consulte a regra de verificação pós-publicação em
  [Releasing](/pt-BR/reference/RELEASING)).

## Segurança

Bundles têm um limite de confiança mais restrito do que Plugins nativos:

- O OpenClaw **não** carrega módulos arbitrários de runtime de bundle in-process
- Caminhos de skills e pacotes de hook devem permanecer dentro da raiz do Plugin (com verificação de limite)
- Arquivos de settings são lidos com as mesmas verificações de limite
- Servidores MCP stdio compatíveis podem ser iniciados como subprocessos

Isso torna bundles mais seguros por padrão, mas você ainda deve tratar bundles de terceiros como conteúdo confiável para os recursos que eles expõem.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O bundle é detectado, mas as capacidades não funcionam">
    Execute `openclaw plugins inspect <id>`. Se uma capacidade estiver listada, mas marcada como
    não conectada, isso é uma limitação do produto — não uma instalação quebrada.
  </Accordion>

  <Accordion title="Arquivos de comando Claude não aparecem">
    Certifique-se de que o bundle está habilitado e que os arquivos markdown estão dentro de uma
    raiz `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="As settings do Claude não se aplicam">
    Apenas settings do Pi incorporado vindas de `settings.json` são compatíveis. O OpenClaw não
    trata settings de bundle como patches brutos de configuração.
  </Accordion>

  <Accordion title="Hooks do Claude não executam">
    `hooks/hooks.json` é apenas detecção. Se você precisa de hooks executáveis, use o
    layout de pacote de hook do OpenClaw ou entregue um Plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar e configurar Plugins](/pt-BR/tools/plugin)
- [Criando Plugins](/pt-BR/plugins/building-plugins) — criar um Plugin nativo
- [Manifest de Plugin](/pt-BR/plugins/manifest) — schema de manifest nativo
