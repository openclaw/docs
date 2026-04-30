---
read_when:
    - Você quer instalar um pacote compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do pacote para recursos nativos
    - Você está depurando a detecção de pacote ou capacidades ausentes
summary: Instale e use os pacotes do Codex, Claude e Cursor como plugins do OpenClaw
title: Pacotes de Plugin
x-i18n:
    generated_at: "2026-04-30T09:58:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw pode instalar plugins de três ecossistemas externos: **Codex**, **Claude**
e **Cursor**. Eles são chamados de **pacotes** — conjuntos de conteúdo e metadados que
o OpenClaw mapeia para recursos nativos como Skills, hooks e ferramentas MCP.

<Info>
  Pacotes **não** são a mesma coisa que plugins nativos do OpenClaw. Plugins nativos são executados
  no processo e podem registrar qualquer capacidade. Pacotes são conjuntos de conteúdo com
  mapeamento seletivo de recursos e uma fronteira de confiança mais estreita.
</Info>

## Por que pacotes existem

Muitos plugins úteis são publicados no formato Codex, Claude ou Cursor. Em vez
de exigir que os autores os reescrevam como plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia o conteúdo compatível deles para o conjunto de recursos
nativo. Isso significa que você pode instalar um pacote de comandos Claude ou um pacote
de Skills Codex e usá-lo imediatamente.

## Instalar um pacote

<Steps>
  <Step title="Instale a partir de um diretório, arquivo ou marketplace">
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

  <Step title="Verifique a detecção">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Pacotes aparecem como `Format: bundle` com um subtipo `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Reinicie e use">
    ```bash
    openclaw gateway restart
    ```

    Recursos mapeados (Skills, hooks, ferramentas MCP, padrões de LSP) ficam disponíveis na próxima sessão.

  </Step>
</Steps>

## O que o OpenClaw mapeia a partir de pacotes

Nem todo recurso de pacote é executado no OpenClaw hoje. Veja o que funciona e o que
é detectado, mas ainda não está conectado.

### Compatível agora

| Recurso       | Como é mapeado                                                                                 | Aplica-se a     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Conteúdo de Skill | Raízes de Skills do pacote são carregadas como Skills normais do OpenClaw                                           | Todos os formatos    |
| Comandos      | `commands/` e `.cursor/commands/` tratados como raízes de Skills                                  | Claude, Cursor |
| Pacotes de hooks    | Layouts no estilo OpenClaw com `HOOK.md` + `handler.ts`                                             | Codex          |
| Ferramentas MCP     | Configuração MCP do pacote mesclada às configurações incorporadas do Pi; servidores stdio e HTTP compatíveis carregados | Todos os formatos    |
| Servidores LSP   | `.lsp.json` do Claude e `lspServers` declarados no manifesto mesclados aos padrões de LSP incorporados do Pi  | Claude         |
| Configurações      | `settings.json` do Claude importado como padrões incorporados do Pi                                     | Claude         |

#### Conteúdo de Skill

- raízes de Skills do pacote são carregadas como raízes de Skills normais do OpenClaw
- raízes `commands` do Claude são tratadas como raízes adicionais de Skills
- raízes `.cursor/commands` do Cursor são tratadas como raízes adicionais de Skills

Isso significa que arquivos de comando markdown do Claude funcionam pelo carregador normal de Skills
do OpenClaw. Markdown de comando do Cursor funciona pelo mesmo caminho.

#### Pacotes de hooks

- raízes de hooks do pacote funcionam **somente** quando usam o layout normal de pacote de hooks
  do OpenClaw. Hoje, este é principalmente o caso compatível com Codex:
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP para Pi

- pacotes habilitados podem contribuir com configuração de servidor MCP
- o OpenClaw mescla a configuração MCP do pacote às configurações incorporadas efetivas do Pi como
  `mcpServers`
- o OpenClaw expõe ferramentas MCP de pacote compatíveis durante turnos do agente Pi incorporado ao
  iniciar servidores stdio ou conectar a servidores HTTP
- os perfis de ferramentas `coding` e `messaging` incluem ferramentas MCP de pacote por
  padrão; use `tools.deny: ["bundle-mcp"]` para desativar para um agente ou Gateway
- configurações locais de projeto do Pi ainda se aplicam após os padrões do pacote, então as configurações
  do workspace podem substituir entradas MCP do pacote quando necessário
- catálogos de ferramentas MCP de pacote são ordenados de forma determinística antes do registro, para que
  mudanças na ordem de `listTools()` upstream não invalidem blocos de ferramentas do cache de prompts

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
- credenciais de URL (userinfo e parâmetros de consulta) são redigidas das descrições de ferramentas
  e dos logs
- `connectionTimeoutMs` substitui o tempo limite de conexão padrão de 30 segundos para
  transportes stdio e HTTP

##### Nomenclatura de ferramentas

O OpenClaw registra ferramentas MCP de pacote com nomes seguros para provedores no formato
`serverName__toolName`. Por exemplo, um servidor com a chave `"vigil-harbor"` que expõe uma
ferramenta `memory_search` é registrado como `vigil-harbor__memory_search`.

- caracteres fora de `A-Za-z0-9_-` são substituídos por `-`
- prefixos de servidor são limitados a 30 caracteres
- nomes completos de ferramentas são limitados a 64 caracteres
- nomes de servidor vazios usam `mcp` como fallback
- nomes sanitizados conflitantes são diferenciados com sufixos numéricos
- a ordem final das ferramentas expostas é determinística por nome seguro para manter turnos repetidos do Pi
  estáveis em cache
- a filtragem de perfil trata todas as ferramentas de um servidor MCP de pacote como pertencentes ao plugin
  `bundle-mcp`, então allowlists e listas de negação de perfil podem incluir tanto
  nomes individuais de ferramentas expostas quanto a chave de plugin `bundle-mcp`

#### Configurações incorporadas do Pi

- `settings.json` do Claude é importado como configurações incorporadas padrão do Pi quando o
  pacote está habilitado
- o OpenClaw sanitiza chaves de substituição de shell antes de aplicá-las

Chaves sanitizadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP incorporado do Pi

- pacotes Claude habilitados podem contribuir com configuração de servidor LSP
- o OpenClaw carrega `.lsp.json` mais quaisquer caminhos `lspServers` declarados no manifesto
- a configuração LSP do pacote é mesclada aos padrões de LSP incorporados efetivos do Pi
- somente servidores LSP compatíveis baseados em stdio são executáveis hoje; transportes
  incompatíveis ainda aparecem em `openclaw plugins inspect <id>`

### Detectado, mas não executado

Estes são reconhecidos e exibidos em diagnósticos, mas o OpenClaw não os executa:

- `agents`, automação `hooks.json`, `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` do Cursor
- metadados inline/de aplicativo do Codex além do relatório de capacidades

## Formatos de pacote

<AccordionGroup>
  <Accordion title="Pacotes Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pacotes Codex se encaixam melhor no OpenClaw quando usam raízes de Skills e diretórios
    de pacotes de hooks no estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pacotes Claude">
    Dois modos de detecção:

    - **Baseado em manifesto:** `.claude-plugin/plugin.json`
    - **Sem manifesto:** layout Claude padrão (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de Skill
    - `settings.json` é importado para configurações incorporadas do Pi (chaves de substituição de shell são sanitizadas)
    - `.mcp.json` expõe ferramentas stdio compatíveis ao Pi incorporado
    - `.lsp.json` mais caminhos `lspServers` declarados no manifesto são carregados nos padrões de LSP incorporados do Pi
    - `hooks/hooks.json` é detectado, mas não executado
    - Caminhos de componentes personalizados no manifesto são aditivos (eles estendem os padrões, não os substituem)

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
2. Marcadores de pacote (`.codex-plugin/`, `.claude-plugin/` ou layout Claude/Cursor padrão) — tratados como **pacote**

Se um diretório contiver ambos, o OpenClaw usa o caminho nativo. Isso impede
que pacotes de formato duplo sejam instalados parcialmente como pacotes.

## Dependências de runtime e limpeza

- Pacotes compatíveis de terceiros não recebem reparo de `npm install` na inicialização. Eles
  devem ser instalados por `openclaw plugins install` e trazer tudo de que
  precisam no diretório do plugin instalado.
- Plugins empacotados em pacotes de propriedade do OpenClaw têm uma exceção estreita: quando um está
  habilitado, a inicialização do Gateway pode reparar dependências de runtime declaradas ausentes
  antes da importação. Operadores podem inspecionar ou reparar esse estágio com
  `openclaw plugins deps`.
- O pipeline de lançamento ainda é responsável por entregar uma carga completa de dependências
  empacotadas quando possível (consulte a regra de verificação pós-publicação em
  [Lançamento](/pt-BR/reference/RELEASING)).

## Segurança

Pacotes têm uma fronteira de confiança mais estreita do que plugins nativos:

- o OpenClaw **não** carrega módulos de runtime arbitrários de pacote no processo
- caminhos de Skills e de pacotes de hooks devem permanecer dentro da raiz do plugin (com verificação de fronteira)
- arquivos de configurações são lidos com as mesmas verificações de fronteira
- servidores MCP stdio compatíveis podem ser iniciados como subprocessos

Isso torna pacotes mais seguros por padrão, mas você ainda deve tratar pacotes de terceiros
como conteúdo confiável para os recursos que eles expõem.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O pacote é detectado, mas as capacidades não são executadas">
    Execute `openclaw plugins inspect <id>`. Se uma capacidade estiver listada, mas marcada como
    não conectada, isso é uma limitação do produto — não uma instalação quebrada.
  </Accordion>

  <Accordion title="Arquivos de comando Claude não aparecem">
    Verifique se o pacote está habilitado e se os arquivos markdown estão dentro de uma raiz
    `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="Configurações Claude não se aplicam">
    Somente configurações incorporadas do Pi de `settings.json` são compatíveis. O OpenClaw não
    trata configurações de pacote como patches de configuração bruta.
  </Accordion>

  <Accordion title="Hooks Claude não são executados">
    `hooks/hooks.json` é somente detecção. Se você precisar de hooks executáveis, use o
    layout de pacote de hooks do OpenClaw ou entregue um plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar e configurar plugins](/pt-BR/tools/plugin)
- [Criar plugins](/pt-BR/plugins/building-plugins) — crie um plugin nativo
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — esquema de manifesto nativo
