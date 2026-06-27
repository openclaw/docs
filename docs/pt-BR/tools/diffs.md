---
read_when:
    - Você quer que agentes mostrem edições de código ou markdown como diffs
    - Você quer uma URL de visualizador pronta para canvas ou um arquivo de diff renderizado
    - Você precisa de artefatos de diff temporários e controlados com padrões seguros
sidebarTitle: Diffs
summary: Visualizador de diff somente leitura e renderizador de arquivos para agentes (ferramenta opcional de Plugin)
title: Diffs
x-i18n:
    generated_at: "2026-06-27T18:14:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` é uma ferramenta opcional de Plugin com orientação de sistema curta integrada e uma skill complementar que transforma conteúdo de alterações em um artefato diff somente leitura para agentes.

Ela aceita:

- texto `before` e `after`
- um `patch` unificado

Ela pode retornar:

- uma URL do visualizador do Gateway para apresentação em canvas
- um caminho de arquivo renderizado (PNG ou PDF) para entrega por mensagem
- ambas as saídas em uma única chamada

Quando habilitado, o Plugin acrescenta orientações concisas de uso ao espaço do prompt de sistema e também expõe uma skill detalhada para casos em que o agente precisa de instruções mais completas.

## Início rápido

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Fluxos com canvas primeiro: agentes chamam `diffs` com `mode: "view"` e abrem `details.viewerUrl` com `canvas present`.
      </Tab>
      <Tab title="file">
        Entrega de arquivo no chat: agentes chamam `diffs` com `mode: "file"` e enviam `details.filePath` com `message` usando `path` ou `filePath`.
      </Tab>
      <Tab title="both">
        Combinado: agentes chamam `diffs` com `mode: "both"` para obter os dois artefatos em uma única chamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Desabilitar a orientação de sistema integrada

Se você quiser manter a ferramenta `diffs` habilitada, mas desabilitar sua orientação integrada de prompt de sistema, defina `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

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

Isso bloqueia o hook `before_prompt_build` do Plugin diffs, mantendo o Plugin, a ferramenta e a skill complementar disponíveis.

Se você quiser desabilitar tanto a orientação quanto a ferramenta, desabilite o Plugin em vez disso.

## Fluxo de trabalho típico do agente

<Steps>
  <Step title="Call diffs">
    O agente chama a ferramenta `diffs` com entrada.
  </Step>
  <Step title="Read details">
    O agente lê os campos `details` da resposta.
  </Step>
  <Step title="Present">
    O agente abre `details.viewerUrl` com `canvas present`, envia `details.filePath` com `message` usando `path` ou `filePath`, ou faz ambos.
  </Step>
</Steps>

## Exemplos de entrada

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Referência de entrada da ferramenta

Todos os campos são opcionais, salvo indicação em contrário.

<ParamField path="before" type="string">
  Texto original. Obrigatório com `after` quando `patch` é omitido.
</ParamField>
<ParamField path="after" type="string">
  Texto atualizado. Obrigatório com `before` quando `patch` é omitido.
</ParamField>
<ParamField path="patch" type="string">
  Texto de diff unificado. Mutuamente exclusivo com `before` e `after`.
</ParamField>
<ParamField path="path" type="string">
  Nome de arquivo de exibição para o modo antes e depois.
</ParamField>
<ParamField path="lang" type="string">
  Dica de substituição de linguagem para o modo antes e depois. Valores desconhecidos e linguagens fora do conjunto padrão do visualizador retornam para texto simples, a menos que o
  Plugin Diff Viewer Language Pack esteja instalado.
</ParamField>

<ParamField path="title" type="string">
  Substituição do título do visualizador.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de saída. O padrão é o padrão do Plugin `defaults.mode`. Alias obsoleto: `"image"` se comporta como `"file"` e ainda é aceito para compatibilidade retroativa.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema do visualizador. O padrão é o padrão do Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Layout do diff. O padrão é o padrão do Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande seções inalteradas quando o contexto completo está disponível. Opção apenas por chamada (não é uma chave padrão do Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato de arquivo renderizado. O padrão é o padrão do Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Predefinição de qualidade para renderização PNG ou PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Substituição de escala do dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Largura máxima de renderização em pixels CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL do artefato em segundos para saídas do visualizador e de arquivo independente. Máximo de 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Substituição da origem da URL do visualizador. Substitui `viewerBaseUrl` do Plugin. Deve ser `http` ou `https`, sem consulta/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Ainda aceitos para compatibilidade retroativa:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` e `after` com máximo de 512 KiB cada.
    - `patch` com máximo de 2 MiB.
    - `path` com máximo de 2048 bytes.
    - `lang` com máximo de 128 bytes.
    - `title` com máximo de 1024 bytes.
    - Limite de complexidade do patch: máximo de 128 arquivos e 120000 linhas no total.
    - `patch` junto com `before` ou `after` é rejeitado.
    - Limites de segurança de arquivo renderizado (aplicam-se a PNG e PDF):
      - `fileQuality: "standard"`: máximo de 8 MP (8.000.000 pixels renderizados).
      - `fileQuality: "hq"`: máximo de 14 MP (14.000.000 pixels renderizados).
      - `fileQuality: "print"`: máximo de 24 MP (24.000.000 pixels renderizados).
      - PDF também tem um máximo de 50 páginas.

  </Accordion>
</AccordionGroup>

## Realce de sintaxe

OpenClaw inclui realce de sintaxe para linguagens comuns de código-fonte, configuração e documentação:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` e `toml`.

Aliases comuns como `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` e `ps1` são normalizados para essas linguagens padrão.

Instale o Plugin Diff Viewer Language Pack para destacar outras linguagens: 

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Com o pacote de linguagens disponível, o OpenClaw consegue destacar muito mais linguagens. Se o pacote não estiver instalado, arquivos fora da lista padrão ainda serão renderizados como texto simples legível. Exemplos incluem Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI e arquivos diff.

Veja o [Plugin Diffs Language Pack](/pt-BR/plugins/reference/diffs-language-pack) para detalhes e [linguagens do Shiki](https://shiki.style/languages) para o catálogo upstream de linguagens e aliases do Shiki.

## Contrato de detalhes de saída

A ferramenta retorna metadados estruturados em `details`.

<AccordionGroup>
  <Accordion title="Campos do visualizador">
    Campos compartilhados para modos que criam um visualizador:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` quando disponível)

  </Accordion>
  <Accordion title="Campos de arquivo">
    Campos de arquivo quando PNG ou PDF é renderizado:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (mesmo valor que `filePath`, para compatibilidade com ferramentas de mensagem)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Aliases de compatibilidade">
    Também retornados para chamadores existentes:

    - `format` (mesmo valor que `fileFormat`)
    - `imagePath` (mesmo valor que `filePath`)
    - `imageBytes` (mesmo valor que `fileBytes`)
    - `imageQuality` (mesmo valor que `fileQuality`)
    - `imageScale` (mesmo valor que `fileScale`)
    - `imageMaxWidth` (mesmo valor que `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Resumo do comportamento dos modos:

| Modo     | O que é retornado                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Apenas campos do visualizador.                                                                                         |
| `"file"` | Apenas campos de arquivo, sem artefato de visualizador.                                                                 |
| `"both"` | Campos do visualizador mais campos de arquivo. Se a renderização do arquivo falhar, o visualizador ainda retorna com o alias `fileError` e `imageError`. |

## Seções inalteradas recolhidas

- O visualizador pode mostrar linhas como `N unmodified lines`.
- Os controles de expansão nessas linhas são condicionais e não são garantidos para todo tipo de entrada.
- Os controles de expansão aparecem quando o diff renderizado tem dados de contexto expansíveis, o que é típico para entradas antes e depois.
- Para muitas entradas de patch unificado, os corpos de contexto omitidos não estão disponíveis nos hunks do patch analisado, então a linha pode aparecer sem controles de expansão. Esse é o comportamento esperado.
- `expandUnchanged` se aplica apenas quando existe contexto expansível.

## Padrões do Plugin

Defina padrões para todo o Plugin em `~/.openclaw/openclaw.json`:

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

Padrões compatíveis:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

Parâmetros explícitos da ferramenta substituem esses padrões.

### Configuração persistente de URL do visualizador

<ParamField path="viewerBaseUrl" type="string">
  Fallback pertencente ao Plugin para links de visualizador retornados quando uma chamada de ferramenta não passa `baseUrl`. Deve ser `http` ou `https`, sem consulta/hash.
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
  `false`: solicitações não loopback para rotas do visualizador são negadas. `true`: visualizadores remotos são permitidos se o caminho tokenizado for válido.
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

- Os artefatos são armazenados na subpasta temporária: `$TMPDIR/openclaw-diffs`.
- Os metadados do artefato do visualizador contêm:
  - ID aleatório do artefato (20 caracteres hexadecimais)
  - token aleatório (48 caracteres hexadecimais)
  - `createdAt` e `expiresAt`
  - caminho armazenado de `viewer.html`
- O TTL padrão do artefato é de 30 minutos quando não especificado.
- O TTL máximo aceito do visualizador é de 6 horas.
- A limpeza é executada oportunisticamente após a criação do artefato.
- Artefatos expirados são excluídos.
- A limpeza de fallback remove pastas obsoletas com mais de 24 horas quando os metadados estão ausentes.

## URL do visualizador e comportamento de rede

Rota do visualizador:

- `/plugins/diffs/view/{artifactId}/{token}`

Assets do visualizador:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` quando o diff usa uma linguagem do Diff Viewer Language Pack

O documento do visualizador resolve esses assets em relação à URL do visualizador, então um prefixo de caminho opcional `baseUrl` também é preservado para ambas as solicitações de assets.

Comportamento de construção de URL:

- Se `baseUrl` da chamada de ferramenta for fornecido, ele será usado após validação rigorosa.
- Caso contrário, se `viewerBaseUrl` do Plugin estiver configurado, ele será usado.
- Sem nenhuma das substituições, a URL do visualizador usa por padrão o loopback `127.0.0.1`.
- Se o modo de vinculação do Gateway for `custom` e `gateway.customBindHost` estiver definido, esse host será usado.

Regras de `baseUrl`:

- Deve ser `http://` ou `https://`.
- Query e hash são rejeitados.
- Origem mais caminho base opcional são permitidos.

## Modelo de segurança

<AccordionGroup>
  <Accordion title="Proteção do visualizador">
    - Apenas loopback por padrão.
    - Caminhos de visualizador tokenizados com validação rigorosa de ID e token.
    - CSP da resposta do visualizador:
      - `default-src 'none'`
      - scripts e assets apenas da própria origem
      - nenhum `connect-src` de saída
    - Limitação de erros remotos quando o acesso remoto está habilitado:
      - 40 falhas a cada 60 segundos
      - bloqueio de 60 segundos (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Proteção da renderização de arquivos">
    - O roteamento de solicitações do navegador para capturas de tela é negar por padrão.
    - Apenas assets locais do visualizador em `http://127.0.0.1/plugins/diffs/assets/*` são permitidos.
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
    Fallback de descoberta de comando/caminho da plataforma.
  </Step>
</Steps>

Texto comum de falha:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrija instalando Chrome, Chromium, Edge ou Brave, ou definindo uma das opções de caminho de executável acima.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Erros de validação de entrada">
    - `Provide patch or both before and after text.` — inclua `before` e `after`, ou forneça `patch`.
    - `Provide either patch or before/after input, not both.` — não misture modos de entrada.
    - `Invalid baseUrl: ...` — use origem `http(s)` com caminho opcional, sem query/hash.
    - `{field} exceeds maximum size (...)` — reduza o tamanho do payload.
    - Rejeição de patch grande — reduza a contagem de arquivos do patch ou o total de linhas.

  </Accordion>
  <Accordion title="Acessibilidade do visualizador">
    - A URL do visualizador resolve para `127.0.0.1` por padrão.
    - Para cenários de acesso remoto:
      - defina `viewerBaseUrl` do Plugin, ou
      - passe `baseUrl` por chamada de ferramenta, ou
      - use `gateway.bind=custom` e `gateway.customBindHost`
    - Se `gateway.trustedProxies` incluir loopback para um proxy no mesmo host (por exemplo, Tailscale Serve), solicitações brutas do visualizador por loopback sem cabeçalhos de IP do cliente encaminhados falham fechadas por design.
    - Para essa topologia de proxy:
      - prefira `mode: "file"` ou `mode: "both"` quando você precisar apenas de um anexo, ou
      - habilite intencionalmente `security.allowRemoteViewer` e defina `viewerBaseUrl` do Plugin ou passe um `baseUrl` de proxy/público quando precisar de uma URL de visualizador compartilhável
    - Habilite `security.allowRemoteViewer` apenas quando você pretende permitir acesso externo ao visualizador.

  </Accordion>
  <Accordion title="A linha de linhas não modificadas não tem botão de expandir">
    Isso pode acontecer para entrada de patch quando o patch não carrega contexto expansível. Isso é esperado e não indica falha do visualizador.
  </Accordion>
  <Accordion title="Artefato não encontrado">
    - O artefato expirou devido ao TTL.
    - O token ou caminho mudou.
    - A limpeza removeu dados obsoletos.

  </Accordion>
</AccordionGroup>

## Orientação operacional

- Prefira `mode: "view"` para revisões interativas locais no canvas.
- Prefira `mode: "file"` para canais de chat de saída que precisam de um anexo.
- Mantenha `allowRemoteViewer` desabilitado, a menos que sua implantação exija URLs remotas do visualizador.
- Defina `ttlSeconds` curto explícito para diffs sensíveis.
- Evite enviar segredos na entrada de diff quando não for necessário.
- Se seu canal comprime imagens de forma agressiva (por exemplo, Telegram ou WhatsApp), prefira saída em PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderização de diff fornecido por [Diffs](https://diffs.com).
</Note>

## Relacionado

- [Navegador](/pt-BR/tools/browser)
- [Plugins](/pt-BR/tools/plugin)
- [Visão geral das ferramentas](/pt-BR/tools)
