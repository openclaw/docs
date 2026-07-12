---
read_when:
    - Você quer instalar um pacote compatível com Codex, Claude ou Cursor
    - Você precisa entender como o OpenClaw mapeia o conteúdo do pacote para recursos nativos
    - Você está depurando a detecção de pacotes ou recursos ausentes
summary: Instale e use os pacotes do Codex, Claude e Cursor como plugins do OpenClaw
title: Pacotes de Plugins
x-i18n:
    generated_at: "2026-07-12T00:07:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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
  executados no processo e podem registrar qualquer funcionalidade. Os pacotes são conjuntos de conteúdo com
  mapeamento seletivo de recursos e um limite de confiança mais restrito.
</Info>

## Por que os pacotes existem

Muitos plugins úteis são publicados no formato Codex, Claude ou Cursor. Em vez
de exigir que os autores os reescrevam como plugins nativos do OpenClaw, o OpenClaw
detecta esses formatos e mapeia o conteúdo compatível para o conjunto de recursos
nativos. Você pode instalar um pacote de comandos do Claude ou um pacote de Skills do Codex e usá-lo
imediatamente.

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

    Os pacotes exibem `Format: bundle` e um valor `Bundle format:` igual a `codex`,
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

Nem todos os recursos dos pacotes são executados atualmente no OpenClaw. Veja o que funciona e o que
é detectado, mas ainda não está integrado.

### Compatível atualmente

| Recurso             | Como é mapeado                                                                                                 | Aplicável a        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------ |
| Conteúdo de Skills  | As raízes de Skills do pacote são carregadas como Skills normais do OpenClaw                                   | Todos os formatos  |
| Comandos            | `commands/` e `.cursor/commands/` são tratados como raízes de Skills                                           | Claude, Cursor     |
| Pacotes de hooks    | Estruturas no estilo do OpenClaw com `HOOK.md` + `handler.ts`                                                  | Codex              |
| Ferramentas MCP     | A configuração MCP do pacote é mesclada às configurações incorporadas do OpenClaw; servidores stdio e HTTP compatíveis são carregados | Todos os formatos  |
| Servidores LSP      | O `.lsp.json` do Claude e os `lspServers` declarados no manifesto são mesclados aos padrões de LSP incorporados do OpenClaw | Claude             |
| Configurações       | O `settings.json` do Claude é importado como padrões incorporados do OpenClaw                                  | Claude             |

#### Conteúdo de Skills

- As raízes de Skills do pacote são carregadas como raízes normais de Skills do OpenClaw.
- As raízes `commands/` do Claude são tratadas como raízes adicionais de Skills.
- As raízes `.cursor/commands/` do Cursor são tratadas como raízes adicionais de Skills.

Os arquivos de comandos Markdown do Claude e os comandos Markdown do Cursor funcionam por meio do
carregador normal de Skills do OpenClaw.

#### Pacotes de hooks

As raízes de hooks dos pacotes funcionam **somente** quando usam a estrutura normal de pacote de hooks
do OpenClaw: `HOOK.md` mais `handler.ts` ou `handler.js`. Atualmente, esse é principalmente
o caso compatível com Codex.

#### MCP para o OpenClaw incorporado

- Pacotes habilitados podem fornecer configuração de servidor MCP.
- O OpenClaw mescla a configuração MCP dos pacotes às configurações efetivas do OpenClaw
  incorporado como `mcpServers`.
- O OpenClaw disponibiliza as ferramentas MCP compatíveis dos pacotes durante as interações do agente
  OpenClaw incorporado, iniciando servidores stdio ou conectando-se a servidores HTTP.
- Os perfis de ferramentas `coding` e `messaging` incluem as ferramentas MCP dos pacotes por
  padrão; use `tools.deny: ["bundle-mcp"]` para desativá-las para um agente ou Gateway.
- As configurações do agente incorporado específicas do projeto ainda são aplicadas após os padrões do pacote, portanto
  as configurações do espaço de trabalho podem substituir entradas MCP do pacote quando necessário.
- Os catálogos de ferramentas MCP dos pacotes são ordenados de forma determinística antes do registro, para que
  alterações na ordem de `listTools()` na origem não causem mudanças constantes nos blocos de ferramentas do cache de prompts.

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

- `transport` aceita `"streamable-http"` ou `"sse"`; quando omitido, o padrão é `sse`.
- `type: "http"` é um formato de destino nativo da CLI; use `transport: "streamable-http"` na configuração do OpenClaw. `openclaw mcp set` e `openclaw doctor --fix` normalizam o alias comum.
- Somente os esquemas de URL `http:` e `https:` são permitidos.
- Os valores de `headers` permitem interpolação de `${ENV_VAR}`.
- Uma entrada de servidor que contenha `command` e `url` é rejeitada.
- As credenciais na URL (informações do usuário e parâmetros de consulta) são ocultadas das descrições
  das ferramentas e dos logs.
- `connectionTimeoutMs` substitui o tempo-limite de conexão padrão de 30 segundos para
  os transportes stdio e HTTP. O tempo-limite padrão das solicitações é de 60 segundos e
  pode ser substituído por `requestTimeoutMs`.

##### Nomenclatura das ferramentas

O OpenClaw registra as ferramentas MCP dos pacotes com nomes seguros para provedores no formato
`serverName__toolName`. Por exemplo, um servidor com a chave `"vigil-harbor"` que disponibiliza uma
ferramenta `memory_search` é registrado como `vigil-harbor__memory_search`.

- Caracteres que não pertencem a `A-Za-z0-9_-` são substituídos por `-`.
- Fragmentos que começariam com um caractere que não fosse uma letra recebem um prefixo alfabético, portanto chaves
  numéricas de servidor, como `12306`, tornam-se prefixos de ferramentas seguros para provedores.
- Os prefixos de servidor são limitados a 30 caracteres.
- Os nomes completos das ferramentas são limitados a 64 caracteres.
- Nomes de servidor vazios usam `mcp` como alternativa.
- Nomes sanitizados conflitantes são diferenciados com sufixos numéricos.
- A ordem final das ferramentas disponibilizadas é determinística pelo nome seguro, mantendo as interações repetidas
  do agente incorporado estáveis no cache.
- A filtragem por perfil trata todas as ferramentas de um servidor MCP de pacote como pertencentes
  ao plugin `bundle-mcp`, portanto as listas de permissão/bloqueio de perfis podem referenciar
  nomes individuais das ferramentas disponibilizadas ou a chave de plugin `bundle-mcp`.

#### Configurações do OpenClaw incorporado

O `settings.json` do Claude é importado como configurações padrão do OpenClaw incorporado quando
o pacote está habilitado. O OpenClaw sanitiza as chaves de substituição do shell antes de aplicá-las:

- `shellPath`
- `shellCommandPrefix`

#### LSP do OpenClaw incorporado

- Pacotes Claude habilitados podem fornecer configuração de servidor LSP.
- O OpenClaw carrega `.lsp.json` e todos os caminhos de `lspServers` declarados no manifesto.
- A configuração LSP do pacote é mesclada aos padrões efetivos de LSP do OpenClaw
  incorporado.
- Atualmente, somente servidores LSP compatíveis e baseados em stdio podem ser executados; transportes
  não compatíveis ainda aparecem em `openclaw plugins inspect <id>`.

### Detectados, mas não executados

Estes itens são reconhecidos e exibidos nos diagnósticos, mas o OpenClaw não os executa:

- Automação de `agents`, `hooks/hooks.json` e `outputStyles` do Claude
- `.cursor/agents`, `.cursor/hooks.json` e `.cursor/rules` do Cursor
- Metadados `.app.json` do Codex além do relatório de funcionalidades

## Formatos de pacote

<AccordionGroup>
  <Accordion title="Pacotes Codex">
    Marcadores: `.codex-plugin/plugin.json`

    Conteúdo opcional: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Os pacotes Codex se integram melhor ao OpenClaw quando usam raízes de Skills e diretórios
    de pacotes de hooks no estilo do OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pacotes Claude">
    Dois modos de detecção:

    - **Baseado em manifesto:** `.claude-plugin/plugin.json`
    - **Sem manifesto:** estrutura padrão do Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento específico do Claude:

    - `commands/` é tratado como conteúdo de Skills
    - `settings.json` é importado para as configurações incorporadas do OpenClaw (as chaves de substituição do shell são sanitizadas)
    - `.mcp.json` disponibiliza ferramentas stdio compatíveis para o OpenClaw incorporado
    - `.lsp.json` e os caminhos de `lspServers` declarados no manifesto são carregados nos padrões de LSP do OpenClaw incorporado
    - `hooks/hooks.json` é detectado, mas não executado
    - Os caminhos de componentes personalizados no manifesto são aditivos; eles ampliam os padrões, não os substituem

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

1. `openclaw.plugin.json` ou um `package.json` válido com `openclaw.extensions` — tratado como um **plugin nativo**
2. Marcadores de pacote (`.codex-plugin/`, `.claude-plugin/` ou a estrutura padrão do Claude/Cursor) — tratados como um **pacote**

Se um diretório contiver ambos, o OpenClaw usará o caminho nativo. Isso impede que
pacotes com dois formatos sejam parcialmente instalados como pacotes.

## Dependências de tempo de execução e limpeza

- Pacotes compatíveis de terceiros não recebem reparo com `npm install` na inicialização. Eles
  devem ser instalados por meio de `openclaw plugins install` e incluir tudo
  de que precisam no diretório do plugin instalado.
- Os plugins incluídos de propriedade do OpenClaw são fornecidos de forma leve no núcleo ou
  podem ser baixados pelo instalador de plugins. A inicialização do Gateway nunca executa um
  gerenciador de pacotes para eles.
- `openclaw doctor --fix` remove registros obsoletos de instalação local de plugins incluídos
  e pode recuperar plugins disponíveis para download que estejam ausentes do índice local de plugins
  quando a configuração ainda fizer referência a eles.

## Segurança

Os pacotes têm um limite de confiança mais restrito do que os plugins nativos:

- O OpenClaw **não** carrega módulos arbitrários de tempo de execução dos pacotes no processo.
- Os caminhos de Skills e pacotes de hooks devem permanecer dentro da raiz do plugin (com verificação de limites).
- Os arquivos de configurações são lidos com as mesmas verificações de limites.
- Servidores MCP stdio compatíveis podem ser iniciados como subprocessos.

Isso torna os pacotes mais seguros por padrão, mas você ainda deve tratar os pacotes
de terceiros como conteúdo confiável para os recursos que eles disponibilizam.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O pacote é detectado, mas as funcionalidades não são executadas">
    Execute `openclaw plugins inspect <id>`. Se uma funcionalidade estiver listada, mas marcada como
    não integrada, trata-se de uma limitação do produto, não de uma instalação com defeito.
  </Accordion>

  <Accordion title="Os arquivos de comandos do Claude não aparecem">
    Verifique se o pacote está habilitado e se os arquivos Markdown estão dentro de uma raiz
    `commands/` ou `skills/` detectada.
  </Accordion>

  <Accordion title="As configurações do Claude não são aplicadas">
    Somente as configurações do OpenClaw incorporado provenientes de `settings.json` são compatíveis. O OpenClaw
    não trata as configurações do pacote como patches de configuração bruta.
  </Accordion>

  <Accordion title="Os hooks do Claude não são executados">
    `hooks/hooks.json` é apenas detectado. Se precisar de hooks executáveis, use a
    estrutura de pacote de hooks do OpenClaw ou forneça um plugin nativo.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Instalar e configurar plugins](/pt-BR/tools/plugin)
- [Criar plugins](/pt-BR/plugins/building-plugins) — crie um plugin nativo
- [Manifesto de plugin](/pt-BR/plugins/manifest) — esquema de manifesto nativo
