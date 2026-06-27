---
read_when:
    - Você quer instalar um pacote compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do pacote para recursos nativos
    - Você está depurando a detecção de pacotes ou capacidades ausentes
summary: Instale e use pacotes do Codex, Claude e Cursor como plugins do OpenClaw
title: Pacotes de Plugins
x-i18n:
    generated_at: "2026-06-27T17:44:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw pode instalar plugins de três ecossistemas externos: **Codex**, **Claude**,
e **Cursor**. Eles são chamados de **pacotes** — pacotes de conteúdo e metadados que
o OpenClaw mapeia para recursos nativos, como Skills, hooks e ferramentas MCP.

<Info>
  Pacotes **não** são o mesmo que plugins nativos do OpenClaw. Plugins nativos são executados
  no processo e podem registrar qualquer capacidade. Pacotes são pacotes de conteúdo com
  mapeamento seletivo de recursos e uma fronteira de confiança mais estreita.
</Info>

## Por que os pacotes existem

Muitos plugins úteis são publicados no formato Codex, Claude ou Cursor. Em vez
de exigir que autores os reescrevam como plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia o conteúdo compatível para o conjunto de recursos
nativos. Isso significa que você pode instalar um pacote de comandos do Claude ou um pacote de Skills do Codex
e usá-lo imediatamente.

## Instalar um pacote

<Steps>
  <Step title="Instalar de um diretório, arquivo compactado ou marketplace">
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

  <Step title="Verificar a detecção">
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

    Recursos mapeados (Skills, hooks, ferramentas MCP, padrões de LSP) ficam disponíveis na próxima sessão.

  </Step>
</Steps>

## O que o OpenClaw mapeia de pacotes

Nem todos os recursos de pacotes são executados no OpenClaw hoje. Veja o que funciona e o que
é detectado, mas ainda não está conectado.

### Compatível agora

| Recurso       | Como ele é mapeado                                                                                       | Aplica-se a     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Conteúdo de Skills | Raízes de Skills do pacote carregam como Skills normais do OpenClaw                                                 | Todos os formatos    |
| Comandos      | `commands/` e `.cursor/commands/` tratados como raízes de Skills                                        | Claude, Cursor |
| Pacotes de hooks    | Layouts no estilo OpenClaw com `HOOK.md` + `handler.ts`                                                   | Codex          |
| Ferramentas MCP     | Configuração MCP do pacote mesclada nas configurações incorporadas do OpenClaw; servidores stdio e HTTP compatíveis carregados | Todos os formatos    |
| Servidores LSP   | `.lsp.json` do Claude e `lspServers` declarados no manifesto mesclados aos padrões de LSP incorporados do OpenClaw  | Claude         |
| Configurações      | `settings.json` do Claude importado como padrões incorporados do OpenClaw                                     | Claude         |

#### Conteúdo de Skills

- raízes de Skills do pacote carregam como raízes de Skills normais do OpenClaw
- raízes `commands` do Claude são tratadas como raízes adicionais de Skills
- raízes `.cursor/commands` do Cursor são tratadas como raízes adicionais de Skills

Isso significa que arquivos de comando em markdown do Claude funcionam pelo carregador normal de Skills do OpenClaw.
Markdown de comandos do Cursor funciona pelo mesmo caminho.

#### Pacotes de hooks

- raízes de hooks de pacote funcionam **somente** quando usam o layout normal de pacote de hooks
  do OpenClaw. Hoje, esse é principalmente o caso compatível com Codex:
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP para OpenClaw incorporado

- pacotes habilitados podem contribuir configuração de servidor MCP
- o OpenClaw mescla a configuração MCP do pacote nas configurações efetivas do OpenClaw incorporado como
  `mcpServers`
- o OpenClaw expõe ferramentas MCP de pacote compatíveis durante turnos de agente do OpenClaw incorporado ao
  iniciar servidores stdio ou conectar a servidores HTTP
- os perfis de ferramentas `coding` e `messaging` incluem ferramentas MCP de pacote por
  padrão; use `tools.deny: ["bundle-mcp"]` para desativar em um agente ou Gateway
- configurações locais de projeto do agente incorporado ainda se aplicam após os padrões do pacote, para que as configurações
  do workspace possam substituir entradas MCP do pacote quando necessário
- catálogos de ferramentas MCP de pacote são ordenados deterministamente antes do registro, para que
  mudanças na ordem upstream de `listTools()` não desestabilizem blocos de ferramentas do cache de prompts

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
- credenciais de URL (userinfo e parâmetros de consulta) são removidas das descrições
  de ferramentas e dos logs
- `connectionTimeoutMs` substitui o tempo limite de conexão padrão de 30 segundos para
  transportes stdio e HTTP

##### Nomenclatura de ferramentas

O OpenClaw registra ferramentas MCP de pacote com nomes seguros para provedores no formato
`serverName__toolName`. Por exemplo, um servidor com a chave `"vigil-harbor"` que expõe uma ferramenta
`memory_search` é registrado como `vigil-harbor__memory_search`.

- caracteres fora de `A-Za-z0-9_-` são substituídos por `-`
- fragmentos que começariam com uma não letra recebem um prefixo de letra, então chaves numéricas
  de servidor, como `12306`, tornam-se prefixos de ferramenta seguros para provedores
- prefixos de servidor são limitados a 30 caracteres
- nomes completos de ferramentas são limitados a 64 caracteres
- nomes de servidor vazios usam `mcp` como fallback
- nomes sanitizados conflitantes são desambiguados com sufixos numéricos
- a ordem final das ferramentas expostas é determinística por nome seguro para manter turnos repetidos de agente incorporado
  estáveis para cache
- a filtragem de perfis trata todas as ferramentas de um servidor MCP de pacote como pertencentes ao plugin
  `bundle-mcp`, então allowlists e listas de negação de perfil podem incluir nomes individuais de ferramentas expostas ou a chave de plugin `bundle-mcp`

#### Configurações do OpenClaw incorporado

- `settings.json` do Claude é importado como configurações padrão do OpenClaw incorporado quando o
  pacote está habilitado
- o OpenClaw sanitiza chaves de substituição de shell antes de aplicá-las

Chaves sanitizadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP do OpenClaw incorporado

- pacotes Claude habilitados podem contribuir configuração de servidor LSP
- o OpenClaw carrega `.lsp.json` mais quaisquer caminhos `lspServers` declarados no manifesto
- a configuração LSP do pacote é mesclada aos padrões efetivos de LSP do OpenClaw incorporado
- somente servidores LSP baseados em stdio compatíveis são executáveis hoje; transportes
  não compatíveis ainda aparecem em `openclaw plugins inspect <id>`

### Detectado, mas não executado

Estes são reconhecidos e mostrados em diagnósticos, mas o OpenClaw não os executa:

- `agents`, automação `hooks.json`, `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` do Cursor
- metadados inline/de app do Codex além do relatório de capacidades

## Formatos de pacote

<AccordionGroup>
  <Accordion title="Pacotes Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pacotes Codex se ajustam melhor ao OpenClaw quando usam raízes de Skills e diretórios de pacote de hooks
    no estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pacotes Claude">
    Dois modos de detecção:

    - **Baseado em manifesto:** `.claude-plugin/plugin.json`
    - **Sem manifesto:** layout padrão do Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de Skills
    - `settings.json` é importado para configurações incorporadas do OpenClaw (chaves de substituição de shell são sanitizadas)
    - `.mcp.json` expõe ferramentas stdio compatíveis ao OpenClaw incorporado
    - `.lsp.json` mais caminhos `lspServers` declarados no manifesto carregam nos padrões de LSP do OpenClaw incorporado
    - `hooks/hooks.json` é detectado, mas não executado
    - Caminhos personalizados de componentes no manifesto são aditivos (eles estendem os padrões, não os substituem)

  </Accordion>

  <Accordion title="Pacotes Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` é tratado como conteúdo de Skills
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` são apenas detectados

  </Accordion>
</AccordionGroup>

## Precedência de detecção

O OpenClaw verifica primeiro o formato de plugin nativo:

1. `openclaw.plugin.json` ou `package.json` válido com `openclaw.extensions` — tratado como **plugin nativo**
2. Marcadores de pacote (`.codex-plugin/`, `.claude-plugin/` ou layout padrão Claude/Cursor) — tratados como **pacote**

Se um diretório contém ambos, o OpenClaw usa o caminho nativo. Isso impede que
pacotes de formato duplo sejam parcialmente instalados como pacotes.

## Dependências de runtime e limpeza

- Pacotes compatíveis de terceiros não recebem reparo de `npm install` na inicialização. Eles
  devem ser instalados por meio de `openclaw plugins install` e enviar tudo
  que precisam no diretório de plugin instalado.
- Plugins empacotados pertencentes ao OpenClaw são enviados leves no core ou
  baixáveis pelo instalador de plugins. A inicialização do Gateway nunca executa um
  gerenciador de pacotes para eles.
- `openclaw doctor --fix` remove diretórios legados de dependências em estágio e pode
  recuperar plugins baixáveis ausentes do índice local de plugins quando
  a configuração faz referência a eles.

## Segurança

Pacotes têm uma fronteira de confiança mais estreita do que plugins nativos:

- o OpenClaw **não** carrega módulos arbitrários de runtime de pacote no processo
- caminhos de Skills e pacotes de hooks devem permanecer dentro da raiz do plugin (com verificação de fronteira)
- arquivos de configurações são lidos com as mesmas verificações de fronteira
- servidores MCP stdio compatíveis podem ser iniciados como subprocessos

Isso torna os pacotes mais seguros por padrão, mas você ainda deve tratar pacotes
de terceiros como conteúdo confiável para os recursos que eles expõem.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O pacote é detectado, mas as capacidades não executam">
    Execute `openclaw plugins inspect <id>`. Se uma capacidade estiver listada, mas marcada como
    não conectada, isso é um limite do produto — não uma instalação quebrada.
  </Accordion>

  <Accordion title="Arquivos de comando do Claude não aparecem">
    Certifique-se de que o pacote esteja habilitado e de que os arquivos markdown estejam dentro de uma raiz
    `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="Configurações do Claude não se aplicam">
    Somente configurações do OpenClaw incorporado de `settings.json` são compatíveis. O OpenClaw
    não trata configurações de pacote como patches brutos de configuração.
  </Accordion>

  <Accordion title="Hooks do Claude não executam">
    `hooks/hooks.json` é apenas detectado. Se você precisa de hooks executáveis, use o
    layout de pacote de hooks do OpenClaw ou envie um plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar e Configurar Plugins](/pt-BR/tools/plugin)
- [Criar Plugins](/pt-BR/plugins/building-plugins) — crie um plugin nativo
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — esquema de manifesto nativo
