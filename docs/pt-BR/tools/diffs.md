---
read_when:
    - Você quer que agentes mostrem edições de código ou markdown como diffs
    - Você quer uma URL do visualizador pronta para canvas ou um arquivo diff renderizado
    - Você precisa de artefatos de diff temporários e controlados com padrões seguros
sidebarTitle: Diffs
summary: Visualizador de diff somente leitura e renderizador de arquivos para agentes (ferramenta de plugin opcional)
title: Diffs
x-i18n:
    generated_at: "2026-04-26T11:38:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` é uma ferramenta de plugin opcional com uma orientação de sistema integrada curta e um Skill complementar que transforma conteúdo de alteração em um artefato de diff somente leitura para agentes.

Ela aceita um destes formatos:

- texto `before` e `after`
- um `patch` unificado

Ela pode retornar:

- uma URL de visualização do gateway para apresentação em canvas
- um caminho de arquivo renderizado (PNG ou PDF) para entrega por mensagem
- ambas as saídas em uma única chamada

Quando habilitado, o plugin adiciona uma orientação de uso concisa no espaço do prompt do sistema e também expõe um Skill detalhado para casos em que o agente precisa de instruções mais completas.

## Início rápido

<Steps>
  <Step title="Habilitar o plugin">
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
  <Step title="Escolher um modo">
    <Tabs>
      <Tab title="view">
        Fluxos orientados a canvas: agentes chamam `diffs` com `mode: "view"` e abrem `details.viewerUrl` com `canvas present`.
      </Tab>
      <Tab title="file">
        Entrega de arquivo no chat: agentes chamam `diffs` com `mode: "file"` e enviam `details.filePath` com `message` usando `path` ou `filePath`.
      </Tab>
      <Tab title="both">
        Combinado: agentes chamam `diffs` com `mode: "both"` para obter ambos os artefatos em uma única chamada.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Desabilitar a orientação de sistema integrada

Se você quiser manter a ferramenta `diffs` habilitada, mas desabilitar sua orientação integrada no prompt do sistema, defina `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

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

Isso bloqueia o hook `before_prompt_build` do plugin diffs, mantendo o plugin, a ferramenta e o Skill complementar disponíveis.

Se você quiser desabilitar tanto a orientação quanto a ferramenta, desabilite o plugin.

## Fluxo de trabalho típico do agente

<Steps>
  <Step title="Chamar diffs">
    O agente chama a ferramenta `diffs` com a entrada.
  </Step>
  <Step title="Ler details">
    O agente lê os campos `details` da resposta.
  </Step>
  <Step title="Apresentar">
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
  Texto original. Obrigatório com `after` quando `patch` for omitido.
</ParamField>
<ParamField path="after" type="string">
  Texto atualizado. Obrigatório com `before` quando `patch` for omitido.
</ParamField>
<ParamField path="patch" type="string">
  Texto de diff unificado. Mutuamente exclusivo com `before` e `after`.
</ParamField>
<ParamField path="path" type="string">
  Nome de arquivo exibido para o modo before e after.
</ParamField>
<ParamField path="lang" type="string">
  Dica de substituição de linguagem para o modo before e after. Valores desconhecidos usam texto simples como fallback.
</ParamField>
<ParamField path="title" type="string">
  Substituição do título do visualizador.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Modo de saída. O padrão é o valor do plugin em `defaults.mode`. Alias descontinuado: `"image"` se comporta como `"file"` e ainda é aceito por compatibilidade retroativa.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Tema do visualizador. O padrão é o valor do plugin em `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Layout do diff. O padrão é o valor do plugin em `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Expande seções inalteradas quando o contexto completo está disponível. Opção somente por chamada (não é uma chave padrão do plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Formato do arquivo renderizado. O padrão é o valor do plugin em `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Predefinição de qualidade para renderização PNG ou PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Substituição da escala do dispositivo (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Largura máxima de renderização em pixels CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL do artefato em segundos para saídas de visualizador e arquivo independente. Máximo de 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Substituição da origem da URL do visualizador. Substitui `viewerBaseUrl` do plugin. Deve ser `http` ou `https`, sem query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Aliases de entrada legados">
    Ainda aceitos por compatibilidade retroativa:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validação e limites">
    - `before` e `after` têm no máximo 512 KiB cada.
    - `patch` tem no máximo 2 MiB.
    - `path` tem no máximo 2048 bytes.
    - `lang` tem no máximo 128 bytes.
    - `title` tem no máximo 1024 bytes.
    - Limite de complexidade de patch: no máximo 128 arquivos e 120000 linhas no total.
    - `patch` junto com `before` ou `after` é rejeitado.
    - Limites de segurança do arquivo renderizado (aplicam-se a PNG e PDF):
      - `fileQuality: "standard"`: máximo de 8 MP (8.000.000 pixels renderizados).
      - `fileQuality: "hq"`: máximo de 14 MP (14.000.000 pixels renderizados).
      - `fileQuality: "print"`: máximo de 24 MP (24.000.000 pixels renderizados).
      - PDF também tem máximo de 50 páginas.

  </Accordion>
</AccordionGroup>

## Contrato de saída de details

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
    - `path` (mesmo valor de `filePath`, para compatibilidade com a ferramenta de mensagem)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Aliases de compatibilidade">
    Também retornados para chamadores existentes:

    - `format` (mesmo valor de `fileFormat`)
    - `imagePath` (mesmo valor de `filePath`)
    - `imageBytes` (mesmo valor de `fileBytes`)
    - `imageQuality` (mesmo valor de `fileQuality`)
    - `imageScale` (mesmo valor de `fileScale`)
    - `imageMaxWidth` (mesmo valor de `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Resumo do comportamento por modo:

| Mode     | O que é retornado                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Apenas campos do visualizador.                                                                                         |
| `"file"` | Apenas campos de arquivo, sem artefato de visualizador.                                                               |
| `"both"` | Campos do visualizador mais campos de arquivo. Se a renderização do arquivo falhar, o visualizador ainda é retornado com `fileError` e o alias `imageError`. |

## Seções inalteradas recolhidas

- O visualizador pode mostrar linhas como `N unmodified lines`.
- Os controles de expansão nessas linhas são condicionais e não são garantidos para todo tipo de entrada.
- Os controles de expansão aparecem quando o diff renderizado tem dados de contexto expansíveis, o que é típico para entrada before e after.
- Para muitas entradas de patch unificado, corpos de contexto omitidos não estão disponíveis nos hunks analisados do patch, então a linha pode aparecer sem controles de expansão. Esse é o comportamento esperado.
- `expandUnchanged` se aplica apenas quando existe contexto expansível.

## Padrões do plugin

Defina padrões globais do plugin em `~/.openclaw/openclaw.json`:

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

Parâmetros explícitos da ferramenta substituem esses padrões.

### Configuração persistente da URL do visualizador

<ParamField path="viewerBaseUrl" type="string">
  Fallback de propriedade do plugin para links de visualizador retornados quando uma chamada da ferramenta não passa `baseUrl`. Deve ser `http` ou `https`, sem query/hash.
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
  - ID aleatório do artefato (20 caracteres hex)
  - token aleatório (48 caracteres hex)
  - `createdAt` e `expiresAt`
  - caminho armazenado de `viewer.html`
- O TTL padrão do artefato é de 30 minutos quando não especificado.
- O TTL máximo aceito para o visualizador é de 6 horas.
- A limpeza é executada de forma oportunista após a criação do artefato.
- Artefatos expirados são excluídos.
- A limpeza de fallback remove pastas antigas com mais de 24 horas quando os metadados estão ausentes.

## Comportamento de URL do visualizador e de rede

Rota do visualizador:

- `/plugins/diffs/view/{artifactId}/{token}`

Assets do visualizador:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

O documento do visualizador resolve esses assets de forma relativa à URL do visualizador, portanto um prefixo de caminho opcional em `baseUrl` também é preservado para essas solicitações de asset.

Comportamento de construção de URL:

- Se `baseUrl` for fornecido na chamada da ferramenta, ele é usado após validação estrita.
- Caso contrário, se `viewerBaseUrl` do plugin estiver configurado, ele é usado.
- Sem qualquer substituição, a URL do visualizador usa por padrão o loopback `127.0.0.1`.
- Se o modo de bind do gateway for `custom` e `gateway.customBindHost` estiver definido, esse host será usado.

Regras de `baseUrl`:

- Deve ser `http://` ou `https://`.
- Query e hash são rejeitados.
- É permitida a origem com um caminho base opcional.

## Modelo de segurança

<AccordionGroup>
  <Accordion title="Endurecimento do visualizador">
    - Somente loopback por padrão.
    - Caminhos tokenizados do visualizador com validação estrita de ID e token.
    - CSP da resposta do visualizador:
      - `default-src 'none'`
      - scripts e assets somente de self
      - sem `connect-src` de saída
    - Limitação de tentativas remotas quando o acesso remoto está habilitado:
      - 40 falhas por 60 segundos
      - bloqueio de 60 segundos (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Endurecimento da renderização de arquivo">
    - O roteamento de requisições do navegador de screenshot é deny-by-default.
    - Apenas assets locais do visualizador de `http://127.0.0.1/plugins/diffs/assets/*` são permitidos.
    - Requisições de rede externas são bloqueadas.

  </Accordion>
</AccordionGroup>

## Requisitos de navegador para o modo file

`mode: "file"` e `mode: "both"` precisam de um navegador compatível com Chromium.

Ordem de resolução:

<Steps>
  <Step title="Config">
    `browser.executablePath` na config do OpenClaw.
  </Step>
  <Step title="Variáveis de ambiente">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Fallback de plataforma">
    Fallback de descoberta por comando/caminho da plataforma.
  </Step>
</Steps>

Texto comum de falha:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrija instalando Chrome, Chromium, Edge ou Brave, ou definindo uma das opções de caminho do executável acima.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Erros de validação de entrada">
    - `Provide patch or both before and after text.` — inclua `before` e `after`, ou forneça `patch`.
    - `Provide either patch or before/after input, not both.` — não misture modos de entrada.
    - `Invalid baseUrl: ...` — use origem `http(s)` com caminho opcional, sem query/hash.
    - `{field} exceeds maximum size (...)` — reduza o tamanho da carga.
    - Rejeição de patch grande — reduza a contagem de arquivos do patch ou o total de linhas.

  </Accordion>
  <Accordion title="Acessibilidade do visualizador">
    - A URL do visualizador resolve para `127.0.0.1` por padrão.
    - Para cenários de acesso remoto, faça uma destas opções:
      - defina `viewerBaseUrl` no plugin, ou
      - passe `baseUrl` por chamada da ferramenta, ou
      - use `gateway.bind=custom` e `gateway.customBindHost`
    - Se `gateway.trustedProxies` incluir loopback para um proxy no mesmo host (por exemplo Tailscale Serve), requisições brutas ao visualizador via loopback sem cabeçalhos encaminhados de IP do cliente falham em modo fechado por design.
    - Para essa topologia de proxy:
      - prefira `mode: "file"` ou `mode: "both"` quando você só precisar de um anexo, ou
      - habilite intencionalmente `security.allowRemoteViewer` e defina `viewerBaseUrl` no plugin ou passe um `baseUrl` de proxy/público quando precisar de uma URL de visualizador compartilhável
    - Habilite `security.allowRemoteViewer` somente quando você pretende permitir acesso externo ao visualizador.

  </Accordion>
  <Accordion title="A linha de linhas não modificadas não tem botão de expandir">
    Isso pode acontecer para entrada de patch quando o patch não carrega contexto expansível. Esse é o comportamento esperado e não indica falha do visualizador.
  </Accordion>
  <Accordion title="Artefato não encontrado">
    - O artefato expirou devido ao TTL.
    - O token ou caminho foi alterado.
    - A limpeza removeu dados obsoletos.

  </Accordion>
</AccordionGroup>

## Orientação operacional

- Prefira `mode: "view"` para revisões interativas locais em canvas.
- Prefira `mode: "file"` para canais de chat de saída que precisam de um anexo.
- Mantenha `allowRemoteViewer` desabilitado, a menos que sua implantação exija URLs remotas do visualizador.
- Defina `ttlSeconds` curto e explícito para diffs sensíveis.
- Evite enviar segredos na entrada do diff quando isso não for necessário.
- Se o seu canal comprimir imagens agressivamente (por exemplo Telegram ou WhatsApp), prefira saída em PDF (`fileFormat: "pdf"`).

<Note>
Motor de renderização de diff fornecido por [Diffs](https://diffs.com).
</Note>

## Relacionado

- [Browser](/pt-BR/tools/browser)
- [Plugins](/pt-BR/tools/plugin)
- [Visão geral das ferramentas](/pt-BR/tools)
