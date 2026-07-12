---
read_when:
    - Você quer que os agentes mostrem edições de código ou Markdown como diffs
    - Você quer uma URL de visualização pronta para o Canvas ou um arquivo de diff renderizado
    - Você precisa de artefatos de diff temporários e controlados, com padrões seguros
sidebarTitle: Diffs
summary: Visualizador de diferenças somente leitura e renderizador de arquivos para agentes (ferramenta de plugin opcional)
title: Diferenças
x-i18n:
    generated_at: "2026-07-12T15:48:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` é uma ferramenta opcional de Plugin incluído que transforma um texto anterior/posterior ou um patch unificado em um artefato de diff somente leitura. Ela também adiciona breves orientações para o agente ao início do prompt do sistema e inclui uma skill complementar com instruções mais completas.

Entrada: texto `before` + `after` ou um `patch` unificado (mutuamente exclusivos).

Saída: uma URL do visualizador do Gateway para apresentação no canvas, um caminho de arquivo PNG/PDF renderizado para envio por mensagem ou ambos.

## Início rápido

<Steps>
  <Step title="Instale o Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Ative o Plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Escolha um modo">
    <Tabs>
      <Tab title="view">
        Fluxos com prioridade para o canvas: os agentes chamam `diffs` com `mode: "view"` e abrem `details.viewerUrl` com `canvas present`.
      </Tab>
      <Tab title="file">
        Envio de arquivo pelo chat: os agentes chamam `diffs` com `mode: "file"` e enviam `details.filePath` com `message` usando `path` ou `filePath`.
      </Tab>
      <Tab title="both">
        Combinado (padrão): os agentes chamam `diffs` com `mode: "both"` para obter ambos os artefatos em uma única chamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Desativar a orientação integrada do sistema

Para manter a ferramenta, mas remover a orientação adicionada ao início do prompt do sistema, defina `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Isso bloqueia o hook `before_prompt_build` do Plugin, mantendo a ferramenta e a skill disponíveis. Para desativar tanto a orientação quanto a ferramenta, desative o Plugin.

## Referência de entrada da ferramenta

Todos os campos são opcionais, salvo indicação em contrário.

<ParamField path="before" type="string">
  Texto original. Obrigatório com `after` quando `patch` for omitido.
</ParamField>
<ParamField path="after" type="string">
  Texto atualizado. Obrigatório com `before` quando `patch` for omitido.
</ParamField>
<ParamField path="patch" type="string">
  Texto de diff unificado. Mutuamente exclusivo com `before` e `after`.
</ParamField>
<ParamField path="path" type="string">
  Nome de arquivo exibido no modo anterior/posterior.
</ParamField>
<ParamField path="lang" type="string">
  Dica para substituir o idioma no modo anterior/posterior. Valores desconhecidos e idiomas fora do conjunto padrão do visualizador usam texto simples como alternativa, a menos que o Plugin Diff Viewer Language Pack esteja instalado.
</ParamField>
<ParamField path="title" type="string">
  Substituição do título do visualizador.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de saída. O padrão é o valor padrão do Plugin `defaults.mode` (`both`). Alias obsoleto: `"image"` se comporta de forma idêntica a `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema do visualizador. O padrão é o valor padrão do Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Layout do diff. O padrão é o valor padrão do Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande as seções inalteradas quando o contexto completo está disponível. Opção apenas por chamada (não é uma chave padrão do Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato do arquivo renderizado. O padrão é o valor padrão do Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Predefinição de qualidade para renderização em PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Substituição da escala do dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Largura máxima da renderização em pixels CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL do artefato em segundos para as saídas do visualizador e de arquivos independentes. Máximo de `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Substituição da origem da URL do visualizador. Substitui `viewerBaseUrl` do Plugin. Deve ser `http` ou `https`, sem consulta/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Validação e limites">
    - `before`/`after`: máximo de 512 KiB cada.
    - `patch`: máximo de 2 MiB.
    - `path`: máximo de 2048 bytes.
    - `lang`: máximo de 128 bytes.
    - `title`: máximo de 1024 bytes.
    - Limite de complexidade do patch: máximo de 128 arquivos e 120000 linhas no total.
    - `patch` junto com `before`/`after` é rejeitado.
    - Limites de segurança do arquivo renderizado (PNG e PDF):
      - `fileQuality: "standard"`: máximo de 8 MP (8,000,000 pixels renderizados).
      - `fileQuality: "hq"`: máximo de 14 MP.
      - `fileQuality: "print"`: máximo de 24 MP.
      - PDF também é limitado a 50 páginas.

  </Accordion>
</AccordionGroup>

## Realce de sintaxe

Linguagens integradas:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` e `toml`.

Aliases comuns (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` etc.) são normalizados para essas linguagens.

Instale o Plugin Diff Viewer Language Pack para obter mais linguagens (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff e outras):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Sem o pacote, linguagens não compatíveis ainda são renderizadas como texto simples legível. Consulte o [Plugin Diffs Language Pack](/pt-BR/plugins/reference/diffs-language-pack) e as [linguagens do Shiki](https://shiki.style/languages) para ver o catálogo upstream.

## Contrato dos detalhes da saída

Todos os resultados bem-sucedidos incluem `changed`: uma entrada anterior/posterior idêntica retorna `false` sem criar um artefato; resultados renderizados retornam `true`.

<AccordionGroup>
  <Accordion title="Campos do visualizador (modos view e both)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` quando disponíveis)

  </Accordion>
  <Accordion title="Campos do arquivo (modos file e both)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (mesmo valor que `filePath`, para compatibilidade com a ferramenta de mensagens)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| Modo     | Retorna                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `"view"` | Somente os campos do visualizador.                                                                            |
| `"file"` | Somente os campos do arquivo, sem artefato do visualizador.                                                   |
| `"both"` | Campos do visualizador e do arquivo. Se a renderização do arquivo falhar, o visualizador ainda será retornado com `fileError`. |

### Seções inalteradas recolhidas

O visualizador mostra linhas como `N unmodified lines`. Os controles de expansão só aparecem quando o diff renderizado tem dados de contexto expansíveis (típico para entradas de antes/depois). Muitos patches unificados omitem os blocos de contexto em seus trechos, portanto a linha pode aparecer sem um controle de expansão — isso é esperado, não é um bug. `expandUnchanged` só se aplica quando existe contexto expansível.

### Navegação entre vários arquivos

Os patches que alteram mais de um arquivo começam com um cartão de resumo dos arquivos alterados: contagens totais de `+N` / `-N`, contagens por arquivo, indicadores de adicionado/excluído/renomeado e links de âncora que levam a cada arquivo. Os arquivos PNG/PDF renderizados mantêm as contagens no cabeçalho de cada arquivo, mas omitem os controles interativos de alternância de visualização, pois eles não funcionam em um arquivo estático.

## Padrões do Plugin

Defina os padrões gerais do Plugin em `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

Chaves de `defaults` compatíveis: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Parâmetros explícitos de chamada de ferramenta substituem esses valores.

### Configuração persistente da URL do visualizador

<ParamField path="viewerBaseUrl" type="string">
  Fallback pertencente ao Plugin para links do visualizador retornados quando uma chamada de ferramenta não fornece `baseUrl`. Deve usar `http` ou `https`, sem consulta/hash.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Configuração de segurança

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: solicitações que não sejam de loopback para as rotas do visualizador são negadas. `true`: visualizadores remotos são permitidos se o caminho com token for válido.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Ciclo de vida e armazenamento de artefatos

- Os artefatos ficam em `$TMPDIR/openclaw-diffs`.
- Os metadados do visualizador armazenam um ID de artefato aleatório de 20 caracteres hexadecimais, um token aleatório de 48 caracteres hexadecimais, `createdAt`/`expiresAt` e o caminho armazenado de `viewer.html`.
- TTL padrão do artefato: 30 minutos. TTL máximo aceito: 6 horas.
- A limpeza é executada de forma oportunista após cada chamada de criação de artefato; os artefatos expirados são excluídos.
- A varredura de contingência remove pastas obsoletas com mais de 24 horas quando os metadados estão ausentes.

## URL do visualizador e comportamento da rede

Rota do visualizador: `/plugins/diffs/view/{artifactId}/{token}`

Recursos do visualizador:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (somente quando o diff usa um idioma do pacote de idiomas)

O documento do visualizador resolve esses recursos em relação à URL do visualizador, portanto, um prefixo de caminho opcional em `baseUrl` também é aplicado às solicitações de recursos.

Ordem de resolução da URL: `baseUrl` da chamada da ferramenta (após validação rigorosa) -> `viewerBaseUrl` do plugin -> padrão de loopback `127.0.0.1`. Se o modo de vinculação do Gateway for `custom` e `gateway.customBindHost` estiver definido, esse host será usado em vez do loopback.

Regras de `baseUrl`: deve ser `http://` ou `https://`; query e hash são rejeitados; é permitida uma origem com um caminho-base opcional.

## Modelo de segurança

<AccordionGroup>
  <Accordion title="Proteção do visualizador">
    - Somente loopback por padrão.
    - Caminhos tokenizados do visualizador com validação rigorosa dos padrões de ID e token.
    - CSP da resposta do visualizador: `default-src 'none'`; scripts/recursos somente da própria origem; nenhum `connect-src` de saída.
    - Limitação de tentativas malsucedidas remotas quando o acesso remoto está habilitado: 40 falhas em 60 segundos acionam um bloqueio de 60 segundos (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Proteção da renderização de arquivos">
    - O roteamento de solicitações do navegador para capturas de tela é bloqueado por padrão.
    - Somente recursos locais do visualizador em `http://127.0.0.1/plugins/diffs/assets/*` são permitidos.
    - Solicitações de rede externas são bloqueadas.

  </Accordion>
</AccordionGroup>

## Requisitos de navegador para o modo de arquivo

`mode: "file"` e `mode: "both"` precisam de um navegador compatível com Chromium.

Ordem de resolução:

  <Steps>
  <Step title="Configuração">
    `browser.executablePath` na configuração do OpenClaw.
  </Step>
  <Step title="Variáveis de ambiente">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Fallback da plataforma">
    Caminhos de instalação comuns e buscas no `PATH` para Chrome, Chromium, Edge e Brave.
  </Step>
</Steps>

Texto comum de falha: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Corrija instalando o Chrome, Chromium, Edge ou Brave, ou definindo uma das opções de caminho do executável acima.

## Solução de problemas

  <AccordionGroup>
  <Accordion title="Erros de validação de entrada">
    - `Provide patch or both before and after text.` -- inclua `before` e `after`, ou forneça `patch`.
    - `Provide either patch or before/after input, not both.` -- não misture os modos de entrada.
    - `Invalid baseUrl: ...` -- use uma origem `http(s)` com caminho opcional, sem consulta/hash.
    - `{field} exceeds maximum size (...)` -- reduza o tamanho da carga útil.
    - Rejeição de patch grande -- reduza a quantidade de arquivos do patch ou o total de linhas.

  </Accordion>
  <Accordion title="Acessibilidade do visualizador">
    - A URL do visualizador é resolvida como `127.0.0.1` por padrão.
    - Para acesso remoto, defina `viewerBaseUrl` no plugin, passe `baseUrl` por chamada ou use `gateway.bind=custom` com `gateway.customBindHost`.
    - Se `gateway.trustedProxies` incluir o endereço de loopback para um proxy no mesmo host (por exemplo, Tailscale Serve), as solicitações brutas do visualizador via loopback sem cabeçalhos encaminhados de IP do cliente falharão de forma segura por design.
    - Para essa topologia de proxy, prefira `mode: "file"`/`"both"` para um anexo ou habilite intencionalmente `security.allowRemoteViewer` junto com `viewerBaseUrl` no plugin/um `baseUrl` de proxy para obter um link compartilhável do visualizador.
    - Habilite `security.allowRemoteViewer` somente quando o acesso externo ao visualizador for desejado.

  </Accordion>
  <Accordion title="A linha de linhas não modificadas não tem botão de expansão">
    Comportamento esperado para uma entrada de patch sem contexto expansível; não é uma falha do visualizador.
  </Accordion>
  <Accordion title="Artefato não encontrado">
    - O artefato expirou devido ao TTL.
    - O token ou o caminho foi alterado.
    - A limpeza removeu dados obsoletos.

  </Accordion>
</AccordionGroup>

## Orientações operacionais

- Prefira `mode: "view"` para revisões interativas locais no canvas.
- Prefira `mode: "file"` para canais de chat externos que precisam de um anexo.
- Mantenha `allowRemoteViewer` desativado, a menos que sua implantação exija URLs de visualização remota.
- Defina um `ttlSeconds` curto e explícito para diffs confidenciais.
- Evite enviar segredos na entrada do diff quando não for necessário.
- Se o seu canal compactar imagens de forma agressiva (por exemplo, Telegram ou WhatsApp), prefira a saída em PDF (`fileFormat: "pdf"`).

<Note>
Mecanismo de renderização de diffs desenvolvido com [Diffs](https://diffs.com).
</Note>

## Relacionados

- [Navegador](/pt-BR/tools/browser)
- [Plugins](/pt-BR/tools/plugin)
- [Visão geral das ferramentas](/pt-BR/tools)
