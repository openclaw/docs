---
read_when:
    - Você quer instalar um pacote compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do pacote para recursos nativos
    - Você está depurando a detecção de pacotes ou capacidades ausentes
summary: Instale e use os pacotes do Codex, Claude e Cursor como plugins do OpenClaw
title: Pacotes de Plugin
x-i18n:
    generated_at: "2026-05-10T19:40:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw pode instalar plugins de três ecossistemas externos: **Codex**, **Claude**
e **Cursor**. Eles são chamados de **pacotes** — conjuntos de conteúdo e metadados que
o OpenClaw mapeia para recursos nativos, como Skills, hooks e ferramentas MCP.

<Info>
  Pacotes **não** são o mesmo que plugins nativos do OpenClaw. Plugins nativos rodam
  no processo e podem registrar qualquer capacidade. Pacotes são conjuntos de conteúdo com
  mapeamento seletivo de recursos e um limite de confiança mais estreito.
</Info>

## Por que os pacotes existem

Muitos plugins úteis são publicados no formato Codex, Claude ou Cursor. Em vez
de exigir que os autores os reescrevam como plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia o conteúdo compatível para o conjunto de recursos
nativos. Isso significa que você pode instalar um pacote de comandos do Claude ou um pacote
de Skills do Codex e usá-lo imediatamente.

## Instalar um pacote

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
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

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Pacotes aparecem como `Format: bundle` com um subtipo de `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    Recursos mapeados (Skills, hooks, ferramentas MCP, padrões de LSP) ficam disponíveis na próxima sessão.

  </Step>
</Steps>

## O que o OpenClaw mapeia de pacotes

Nem todo recurso de pacote roda no OpenClaw hoje. Veja o que funciona e o que
é detectado, mas ainda não está conectado.

### Compatível agora

| Recurso       | Como é mapeado                                                                                 | Aplica-se a     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Conteúdo de Skill | Raízes de Skills do pacote são carregadas como Skills normais do OpenClaw                                           | Todos os formatos    |
| Comandos      | `commands/` e `.cursor/commands/` tratados como raízes de Skills                                  | Claude, Cursor |
| Pacotes de hooks    | Layouts no estilo OpenClaw com `HOOK.md` + `handler.ts`                                             | Codex          |
| Ferramentas MCP     | Configuração MCP do pacote mesclada às configurações do Pi incorporado; servidores stdio e HTTP compatíveis carregados | Todos os formatos    |
| Servidores LSP   | `.lsp.json` do Claude e `lspServers` declarados no manifesto mesclados aos padrões de LSP do Pi incorporado  | Claude         |
| Configurações      | `settings.json` do Claude importado como padrões do Pi incorporado                                     | Claude         |

#### Conteúdo de Skill

- raízes de Skills do pacote são carregadas como raízes normais de Skills do OpenClaw
- raízes `commands` do Claude são tratadas como raízes adicionais de Skills
- raízes `.cursor/commands` do Cursor são tratadas como raízes adicionais de Skills

Isso significa que arquivos de comando markdown do Claude funcionam pelo carregador
normal de Skills do OpenClaw. Markdown de comandos do Cursor funciona pelo mesmo caminho.

#### Pacotes de hooks

- raízes de hooks de pacote funcionam **somente** quando usam o layout normal de
  pacote de hooks do OpenClaw. Hoje, esse é principalmente o caso compatível com Codex:
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP para Pi

- pacotes habilitados podem contribuir com configuração de servidor MCP
- o OpenClaw mescla a configuração MCP do pacote nas configurações efetivas do Pi incorporado como
  `mcpServers`
- o OpenClaw expõe ferramentas MCP compatíveis de pacotes durante turnos do agente Pi incorporado ao
  iniciar servidores stdio ou conectar-se a servidores HTTP
- os perfis de ferramentas `coding` e `messaging` incluem ferramentas MCP de pacotes por
  padrão; use `tools.deny: ["bundle-mcp"]` para desativar em um agente ou Gateway
- configurações do Pi locais do projeto ainda se aplicam após os padrões do pacote, portanto
  configurações do workspace podem substituir entradas MCP do pacote quando necessário
- catálogos de ferramentas MCP de pacotes são ordenados de forma determinística antes do registro, para que
  mudanças na ordem upstream de `listTools()` não causem instabilidade nos blocos de ferramentas do cache de prompt

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

**HTTP** conecta-se a um servidor MCP em execução por `sse` por padrão, ou por `streamable-http` quando solicitado:

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
- credenciais de URL (userinfo e parâmetros de consulta) são redigidas de descrições
  de ferramentas e logs
- `connectionTimeoutMs` substitui o tempo limite de conexão padrão de 30 segundos para
  transportes stdio e HTTP

##### Nomenclatura de ferramentas

O OpenClaw registra ferramentas MCP de pacotes com nomes seguros para provedores no formato
`serverName__toolName`. Por exemplo, um servidor com chave `"vigil-harbor"` expondo uma
ferramenta `memory_search` é registrado como `vigil-harbor__memory_search`.

- caracteres fora de `A-Za-z0-9_-` são substituídos por `-`
- fragmentos que começariam com algo que não seja letra recebem um prefixo de letra, para que chaves
  numéricas de servidor, como `12306`, se tornem prefixos de ferramentas seguros para provedores
- prefixos de servidor são limitados a 30 caracteres
- nomes completos de ferramentas são limitados a 64 caracteres
- nomes de servidor vazios usam `mcp` como fallback
- nomes sanitizados em colisão são diferenciados com sufixos numéricos
- a ordem final das ferramentas expostas é determinística por nome seguro para manter turnos
  repetidos do Pi estáveis em cache
- a filtragem de perfis trata todas as ferramentas de um servidor MCP de pacote como pertencentes ao plugin
  `bundle-mcp`, portanto allowlists e listas de negação de perfis podem incluir tanto
  nomes individuais de ferramentas expostas quanto a chave de plugin `bundle-mcp`

#### Configurações do Pi incorporado

- `settings.json` do Claude é importado como configurações padrão do Pi incorporado quando o
  pacote está habilitado
- o OpenClaw sanitiza chaves de substituição de shell antes de aplicá-las

Chaves sanitizadas:

- `shellPath`
- `shellCommandPrefix`

#### LSP do Pi incorporado

- pacotes Claude habilitados podem contribuir com configuração de servidor LSP
- o OpenClaw carrega `.lsp.json` mais quaisquer caminhos `lspServers` declarados no manifesto
- a configuração LSP do pacote é mesclada aos padrões efetivos de LSP do Pi incorporado
- somente servidores LSP compatíveis baseados em stdio são executáveis hoje; transportes
  não compatíveis ainda aparecem em `openclaw plugins inspect <id>`

### Detectado, mas não executado

Estes itens são reconhecidos e exibidos em diagnósticos, mas o OpenClaw não os executa:

- `agents`, automação `hooks.json`, `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` do Cursor
- metadados inline/de aplicativo do Codex além do relatório de capacidades

## Formatos de pacote

<AccordionGroup>
  <Accordion title="Codex bundles">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pacotes do Codex se ajustam melhor ao OpenClaw quando usam raízes de Skills e diretórios
    de pacotes de hooks no estilo OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Dois modos de detecção:

    - **Baseado em manifesto:** `.claude-plugin/plugin.json`
    - **Sem manifesto:** layout padrão do Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de Skills
    - `settings.json` é importado para configurações do Pi incorporado (chaves de substituição de shell são sanitizadas)
    - `.mcp.json` expõe ferramentas stdio compatíveis ao Pi incorporado
    - `.lsp.json` mais caminhos `lspServers` declarados no manifesto são carregados nos padrões de LSP do Pi incorporado
    - `hooks/hooks.json` é detectado, mas não executado
    - caminhos de componentes personalizados no manifesto são aditivos (eles estendem os padrões, não os substituem)

  </Accordion>

  <Accordion title="Cursor bundles">
    Marcadores: `.cursor-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` é tratado como conteúdo de Skills
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` são apenas detectados

  </Accordion>
</AccordionGroup>

## Precedência de detecção

O OpenClaw verifica primeiro o formato de plugin nativo:

1. `openclaw.plugin.json` ou `package.json` válido com `openclaw.extensions` — tratado como **plugin nativo**
2. Marcadores de pacote (`.codex-plugin/`, `.claude-plugin/` ou layout padrão Claude/Cursor) — tratado como **pacote**

Se um diretório contiver ambos, o OpenClaw usa o caminho nativo. Isso impede que
pacotes de formato duplo sejam instalados parcialmente como pacotes.

## Dependências de runtime e limpeza

- Pacotes compatíveis de terceiros não recebem reparo `npm install` na inicialização. Eles
  devem ser instalados por `openclaw plugins install` e incluir tudo de que
  precisam no diretório do plugin instalado.
- Plugins empacotados pertencentes ao OpenClaw são enviados de forma leve no núcleo ou
  baixáveis pelo instalador de plugins. A inicialização do Gateway nunca roda um
  gerenciador de pacotes para eles.
- `openclaw doctor --fix` remove diretórios legados de dependências em preparo e pode
  recuperar plugins baixáveis ausentes do índice local de plugins quando
  a configuração os referencia.

## Segurança

Pacotes têm um limite de confiança mais estreito que plugins nativos:

- o OpenClaw **não** carrega módulos arbitrários de runtime de pacotes no processo
- caminhos de Skills e pacotes de hooks devem permanecer dentro da raiz do plugin (com verificação de limite)
- arquivos de configurações são lidos com as mesmas verificações de limite
- servidores MCP stdio compatíveis podem ser iniciados como subprocessos

Isso torna pacotes mais seguros por padrão, mas você ainda deve tratar pacotes
de terceiros como conteúdo confiável para os recursos que eles expõem.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    Rode `openclaw plugins inspect <id>`. Se uma capacidade estiver listada, mas marcada como
    não conectada, isso é um limite do produto — não uma instalação quebrada.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Verifique se o pacote está habilitado e se os arquivos markdown estão dentro de uma raiz
    `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Somente configurações do Pi incorporado de `settings.json` são compatíveis. O OpenClaw não
    trata configurações de pacote como patches brutos de configuração.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` é apenas detectado. Se você precisa de hooks executáveis, use o
    layout de pacote de hooks do OpenClaw ou envie um plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar e configurar plugins](/pt-BR/tools/plugin)
- [Criar plugins](/pt-BR/plugins/building-plugins) — crie um plugin nativo
- [Manifesto de plugin](/pt-BR/plugins/manifest) — esquema de manifesto nativo
