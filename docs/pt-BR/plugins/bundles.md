---
read_when:
    - Você quer instalar um pacote compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do pacote para recursos nativos
    - Você está depurando a detecção de pacotes ou recursos ausentes
summary: Instale e use os pacotes do Codex, Claude e Cursor como plugins do OpenClaw
title: Pacotes de plugins
x-i18n:
    generated_at: "2026-07-12T15:22:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

O OpenClaw pode instalar plugins de três ecossistemas externos: **Codex**, **Claude**
e **Cursor**. Eles são chamados de **pacotes** — conjuntos de conteúdo e metadados que
o OpenClaw mapeia para recursos nativos, como Skills, hooks e ferramentas MCP.

<Info>
  Os pacotes **não** são iguais aos plugins nativos do OpenClaw. Os plugins nativos são
  executados dentro do processo e podem registrar qualquer recurso. Os pacotes são conjuntos
  de conteúdo com mapeamento seletivo de recursos e um limite de confiança mais restrito.
</Info>

## Por que os pacotes existem

Muitos plugins úteis são publicados no formato do Codex, Claude ou Cursor. Em vez
de exigir que os autores os reescrevam como plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia o conteúdo compatível para o conjunto de recursos
nativos. Você pode instalar um pacote de comandos do Claude ou um pacote de Skills
do Codex e usá-lo imediatamente.

## Instalar um pacote

<Steps>
  <Step title="Instalar de um diretório, arquivo compactado ou marketplace">
    ```bash
    # Diretório local
    openclaw plugins install ./my-bundle

    # Arquivo compactado
    openclaw plugins install ./my-bundle.tgz

    # Marketplace do Claude
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` é um caminho/repositório de marketplace local ou uma origem git/GitHub.

  </Step>

  <Step title="Verificar a detecção">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Os pacotes exibem `Format: bundle`, além de um valor `Bundle format:` igual a `codex`,
    `claude` ou `cursor`.

  </Step>

  <Step title="Reiniciar e usar">
    ```bash
    openclaw gateway restart
    ```

    Os recursos mapeados (Skills, hooks, ferramentas MCP e padrões de LSP) ficam disponíveis na próxima sessão.

  </Step>
</Steps>

## O que o OpenClaw mapeia dos pacotes

Nem todos os recursos de pacotes são executados no OpenClaw atualmente. Veja o que funciona
e o que é detectado, mas ainda não está integrado.

### Compatível atualmente

| Recurso             | Como é mapeado                                                                                             | Aplica-se a         |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------- |
| Conteúdo de Skills  | As raízes de Skills do pacote são carregadas como Skills normais do OpenClaw                               | Todos os formatos   |
| Comandos            | `commands/` e `.cursor/commands/` são tratados como raízes de Skills                                       | Claude, Cursor      |
| Pacotes de hooks    | Layouts no estilo do OpenClaw com `HOOK.md` + `handler.ts`                                                 | Codex               |
| Ferramentas MCP     | A configuração MCP do pacote é mesclada às configurações integradas do OpenClaw; servidores stdio e HTTP compatíveis são carregados | Todos os formatos |
| Servidores LSP      | O `.lsp.json` do Claude e os `lspServers` declarados no manifesto são mesclados aos padrões de LSP integrados do OpenClaw | Claude |
| Configurações       | O `settings.json` do Claude é importado como padrões integrados do OpenClaw                                | Claude              |

#### Conteúdo de Skills

- As raízes de Skills do pacote são carregadas como raízes normais de Skills do OpenClaw.
- As raízes `commands/` do Claude são tratadas como raízes adicionais de Skills.
- As raízes `.cursor/commands/` do Cursor são tratadas como raízes adicionais de Skills.

Os arquivos de comando Markdown do Claude e os arquivos Markdown de comando do Cursor funcionam por meio do
carregador normal de Skills do OpenClaw.

#### Pacotes de hooks

As raízes de hooks do pacote funcionam **somente** quando usam o layout normal de pacote
de hooks do OpenClaw: `HOOK.md` acompanhado de `handler.ts` ou `handler.js`. Atualmente,
esse é principalmente o caso compatível com o Codex.

#### MCP para o OpenClaw integrado

- Pacotes habilitados podem fornecer configurações de servidor MCP.
- O OpenClaw mescla a configuração MCP do pacote às configurações efetivas do OpenClaw
  integrado como `mcpServers`.
- O OpenClaw disponibiliza as ferramentas MCP compatíveis dos pacotes durante as interações
  do agente integrado do OpenClaw, iniciando servidores stdio ou conectando-se a servidores HTTP.
- Os perfis de ferramentas `coding` e `messaging` incluem ferramentas MCP dos pacotes por
  padrão; use `tools.deny: ["bundle-mcp"]` para desativá-las para um agente ou Gateway.
- As configurações locais do projeto para o agente integrado continuam sendo aplicadas depois
  dos padrões dos pacotes; portanto, as configurações do espaço de trabalho podem substituir
  entradas MCP dos pacotes quando necessário.
- Os catálogos de ferramentas MCP dos pacotes são ordenados deterministicamente antes do registro,
  para que mudanças na ordem de `listTools()` da origem não alterem repetidamente os blocos de
  ferramentas do cache de prompts.

##### Transportes

Os servidores MCP podem usar transporte stdio ou HTTP.

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

**HTTP** conecta-se a um servidor MCP em execução, usando `sse` por padrão, a menos que
`streamable-http` seja solicitado:

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

- `transport` aceita `"streamable-http"` ou `"sse"`; se omitido, o padrão é `sse`.
- `type: "http"` é um formato subsequente nativo da CLI; use `transport: "streamable-http"` na configuração do OpenClaw. `openclaw mcp set` e `openclaw doctor --fix` normalizam o alias comum.
- Somente os esquemas de URL `http:` e `https:` são permitidos.
- Os valores de `headers` são compatíveis com interpolação `${ENV_VAR}`.
- Uma entrada de servidor que contenha `command` e `url` é rejeitada.
- As credenciais da URL (informações do usuário e parâmetros de consulta) são ocultadas das descrições
  das ferramentas e dos logs.
- `connectionTimeoutMs` substitui o tempo limite padrão de conexão de 30 segundos para
  os transportes stdio e HTTP. O tempo limite padrão das solicitações é de 60 segundos e
  pode ser substituído com `requestTimeoutMs`.

##### Nomenclatura das ferramentas

O OpenClaw registra as ferramentas MCP dos pacotes com nomes seguros para provedores no formato
`serverName__toolName`. Por exemplo, um servidor com a chave `"vigil-harbor"` que disponibiliza uma
ferramenta `memory_search` é registrado como `vigil-harbor__memory_search`.

- Caracteres fora de `A-Za-z0-9_-` são substituídos por `-`.
- Fragmentos que começariam com um caractere que não fosse uma letra recebem um prefixo alfabético; assim,
  chaves numéricas de servidor como `12306` tornam-se prefixos de ferramenta seguros para provedores.
- Os prefixos de servidor são limitados a 30 caracteres.
- Os nomes completos das ferramentas são limitados a 64 caracteres.
- Nomes de servidor vazios usam `mcp` como alternativa.
- Nomes sanitizados conflitantes são diferenciados com sufixos numéricos.
- A ordem final das ferramentas disponibilizadas é determinística pelo nome seguro, mantendo estáveis no
  cache as interações repetidas do agente integrado.
- A filtragem de perfis trata todas as ferramentas de um servidor MCP de pacote como pertencentes
  ao Plugin `bundle-mcp`; portanto, as listas de permissão/bloqueio de perfis podem referenciar
  os nomes individuais das ferramentas disponibilizadas ou a chave de Plugin `bundle-mcp`.

#### Configurações do OpenClaw integrado

O `settings.json` do Claude é importado como configurações padrão do OpenClaw integrado quando
o pacote está habilitado. O OpenClaw sanitiza as chaves de substituição de shell antes de aplicá-las:

- `shellPath`
- `shellCommandPrefix`

#### LSP do OpenClaw integrado

- Pacotes do Claude habilitados podem fornecer configurações de servidor LSP.
- O OpenClaw carrega `.lsp.json` e quaisquer caminhos `lspServers` declarados no manifesto.
- A configuração LSP do pacote é mesclada aos padrões efetivos de LSP do OpenClaw
  integrado.
- Atualmente, somente servidores LSP compatíveis baseados em stdio podem ser executados; transportes
  incompatíveis ainda aparecem em `openclaw plugins inspect <id>`.

### Detectado, mas não executado

Estes itens são reconhecidos e exibidos nos diagnósticos, mas o OpenClaw não os executa:

- Automação de `agents`, `hooks/hooks.json` e `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json` e `.cursor/rules` do Cursor
- Metadados `.app.json` do Codex além dos relatórios de recursos

## Formatos de pacote

<AccordionGroup>
  <Accordion title="Pacotes do Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Os pacotes do Codex se adaptam melhor ao OpenClaw quando usam raízes de Skills e diretórios
    de pacotes de hooks no estilo do OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pacotes do Claude">
    Dois modos de detecção:

    - **Com base em manifesto:** `.claude-plugin/plugin.json`
    - **Sem manifesto:** layout padrão do Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de Skills
    - `settings.json` é importado para as configurações integradas do OpenClaw (as chaves de substituição de shell são sanitizadas)
    - `.mcp.json` disponibiliza ferramentas stdio compatíveis para o OpenClaw integrado
    - `.lsp.json` e os caminhos `lspServers` declarados no manifesto são carregados nos padrões de LSP do OpenClaw integrado
    - `hooks/hooks.json` é detectado, mas não executado
    - Os caminhos de componentes personalizados no manifesto são aditivos; eles ampliam os padrões, em vez de substituí-los

  </Accordion>

  <Accordion title="Pacotes do Cursor">
    Marcadores: `.cursor-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` é tratado como conteúdo de Skills
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` são somente detectados

  </Accordion>
</AccordionGroup>

## Precedência de detecção

O OpenClaw verifica primeiro o formato de Plugin nativo:

1. `openclaw.plugin.json` ou um `package.json` válido com `openclaw.extensions` — tratado como um **Plugin nativo**
2. Marcadores de pacote (`.codex-plugin/`, `.claude-plugin/` ou o layout padrão do Claude/Cursor) — tratados como um **pacote**

Se um diretório contiver ambos, o OpenClaw usará o caminho nativo. Isso impede que
pacotes em dois formatos sejam instalados parcialmente como pacotes.

## Dependências de runtime e limpeza

- Pacotes compatíveis de terceiros não recebem reparo de `npm install` na inicialização. Eles
  devem ser instalados por meio de `openclaw plugins install` e incluir tudo de que
  precisam no diretório do Plugin instalado.
- Os plugins incluídos de propriedade do OpenClaw são fornecidos de forma leve no núcleo ou
  podem ser baixados por meio do instalador de plugins. A inicialização do Gateway nunca executa
  um gerenciador de pacotes para eles.
- `openclaw doctor --fix` remove registros obsoletos de instalação local de plugins incluídos
  e pode recuperar plugins disponíveis para download que estejam ausentes do índice local de plugins
  quando a configuração ainda fizer referência a eles.

## Segurança

Os pacotes têm um limite de confiança mais restrito que os plugins nativos:

- O OpenClaw **não** carrega módulos arbitrários de runtime dos pacotes dentro do processo.
- Os caminhos de Skills e de pacotes de hooks devem permanecer dentro da raiz do Plugin (com verificação de limites).
- Os arquivos de configurações são lidos com as mesmas verificações de limites.
- Servidores MCP stdio compatíveis podem ser iniciados como subprocessos.

Isso torna os pacotes mais seguros por padrão, mas você ainda deve tratar pacotes de
terceiros como conteúdo confiável para os recursos que eles disponibilizam.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O pacote é detectado, mas os recursos não são executados">
    Execute `openclaw plugins inspect <id>`. Se um recurso estiver listado, mas marcado como
    não integrado, isso é uma limitação do produto, não uma instalação com defeito.
  </Accordion>

  <Accordion title="Os arquivos de comando do Claude não aparecem">
    Verifique se o pacote está habilitado e se os arquivos Markdown estão dentro de uma raiz
    `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="As configurações do Claude não são aplicadas">
    Somente configurações do OpenClaw integrado provenientes de `settings.json` são compatíveis. O OpenClaw
    não trata as configurações dos pacotes como patches de configuração brutos.
  </Accordion>

  <Accordion title="Os hooks do Claude não são executados">
    `hooks/hooks.json` é somente detectado. Se você precisar de hooks executáveis, use o
    layout de pacotes de hooks do OpenClaw ou forneça um Plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar e configurar plugins](/pt-BR/tools/plugin)
- [Criar plugins](/pt-BR/plugins/building-plugins) — crie um Plugin nativo
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — esquema de manifesto nativo
