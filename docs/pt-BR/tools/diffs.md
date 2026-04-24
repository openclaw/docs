---
read_when:
    - Você quer que agentes mostrem edições de código ou markdown como diffs
    - Você quer uma URL pronta para canvas ou um arquivo de diff renderizado
    - Você precisa de artefatos temporários de diff controlados com padrões seguros
summary: Visualizador de diff somente leitura e renderizador de arquivos para agentes (ferramenta opcional de Plugin)
title: Diffs
x-i18n:
    generated_at: "2026-04-24T06:15:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` é uma ferramenta opcional de Plugin com orientação curta integrada de sistema e uma skill complementar que transforma conteúdo de mudança em um artefato de diff somente leitura para agentes.

Ela aceita:

- texto `before` e `after`
- um `patch` unificado

Ela pode retornar:

- uma URL de visualização do gateway para apresentação em canvas
- um caminho de arquivo renderizado (PNG ou PDF) para entrega por mensagem
- ambas as saídas em uma única chamada

Quando ativado, o Plugin adiciona orientação de uso concisa ao espaço de prompt do sistema e também expõe uma skill detalhada para casos em que o agente precisa de instruções mais completas.

## Início rápido

1. Ative o Plugin.
2. Chame `diffs` com `mode: "view"` para fluxos com foco em canvas.
3. Chame `diffs` com `mode: "file"` para fluxos de entrega de arquivo em chat.
4. Chame `diffs` com `mode: "both"` quando precisar de ambos os artefatos.

## Ativar o Plugin

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

## Desativar a orientação integrada do sistema

Se você quiser manter a ferramenta `diffs` ativada, mas desativar sua orientação integrada no prompt de sistema, defina `plugins.entries.diffs.hooks.allowPromptInjection` como `false`:

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

Se você quiser desativar tanto a orientação quanto a ferramenta, desative o Plugin.

## Fluxo de trabalho típico do agente

1. O agente chama `diffs`.
2. O agente lê os campos `details`.
3. O agente então:
   - abre `details.viewerUrl` com `canvas present`
   - envia `details.filePath` com `message` usando `path` ou `filePath`
   - faz ambos

## Exemplos de entrada

Antes e depois:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Referência de entrada da ferramenta

Todos os campos são opcionais, salvo indicação em contrário:

- `before` (`string`): texto original. Obrigatório com `after` quando `patch` for omitido.
- `after` (`string`): texto atualizado. Obrigatório com `before` quando `patch` for omitido.
- `patch` (`string`): texto de diff unificado. Mutuamente exclusivo com `before` e `after`.
- `path` (`string`): nome de arquivo exibido para o modo before e after.
- `lang` (`string`): dica de substituição de idioma para o modo before e after. Valores desconhecidos recorrem a texto simples.
- `title` (`string`): substituição do título do visualizador.
- `mode` (`"view" | "file" | "both"`): modo de saída. Usa como padrão o padrão do Plugin `defaults.mode`.
  Alias obsoleto: `"image"` se comporta como `"file"` e ainda é aceito por compatibilidade retroativa.
- `theme` (`"light" | "dark"`): tema do visualizador. Usa como padrão o padrão do Plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): layout do diff. Usa como padrão o padrão do Plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): expande seções inalteradas quando o contexto completo está disponível. Opção apenas por chamada (não é uma chave padrão do Plugin).
- `fileFormat` (`"png" | "pdf"`): formato do arquivo renderizado. Usa como padrão o padrão do Plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset de qualidade para renderização PNG ou PDF.
- `fileScale` (`number`): substituição da escala do dispositivo (`1`-`4`).
- `fileMaxWidth` (`number`): largura máxima de renderização em pixels CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL do artefato em segundos para saídas de visualizador e arquivo independente. Padrão 1800, máximo 21600.
- `baseUrl` (`string`): substituição da origem da URL do visualizador. Substitui `viewerBaseUrl` do Plugin. Deve ser `http` ou `https`, sem query/hash.

Aliases legados de entrada ainda aceitos por compatibilidade retroativa:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Validação e limites:

- `before` e `after` com máximo de 512 KiB cada.
- `patch` com máximo de 2 MiB.
- `path` com máximo de 2048 bytes.
- `lang` com máximo de 128 bytes.
- `title` com máximo de 1024 bytes.
- Limite de complexidade do patch: máximo de 128 arquivos e 120000 linhas no total.
- `patch` junto com `before` ou `after` é rejeitado.
- Limites de segurança do arquivo renderizado (aplicam-se a PNG e PDF):
  - `fileQuality: "standard"`: máximo de 8 MP (8.000.000 de pixels renderizados).
  - `fileQuality: "hq"`: máximo de 14 MP (14.000.000 de pixels renderizados).
  - `fileQuality: "print"`: máximo de 24 MP (24.000.000 de pixels renderizados).
  - PDF também tem máximo de 50 páginas.

## Contrato de detalhes da saída

A ferramenta retorna metadados estruturados em `details`.

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

Aliases de compatibilidade também retornados para chamadores existentes:

- `format` (mesmo valor de `fileFormat`)
- `imagePath` (mesmo valor de `filePath`)
- `imageBytes` (mesmo valor de `fileBytes`)
- `imageQuality` (mesmo valor de `fileQuality`)
- `imageScale` (mesmo valor de `fileScale`)
- `imageMaxWidth` (mesmo valor de `fileMaxWidth`)

Resumo do comportamento por modo:

- `mode: "view"`: apenas campos do visualizador.
- `mode: "file"`: apenas campos de arquivo, sem artefato de visualizador.
- `mode: "both"`: campos do visualizador mais campos de arquivo. Se a renderização do arquivo falhar, o visualizador ainda retorna com `fileError` e o alias de compatibilidade `imageError`.

## Seções inalteradas recolhidas

- O visualizador pode mostrar linhas como `N unmodified lines`.
- Controles de expansão nessas linhas são condicionais e não são garantidos para todo tipo de entrada.
- Controles de expansão aparecem quando o diff renderizado tem dados de contexto expansíveis, o que é típico para entrada before e after.
- Para muitas entradas de patch unificado, corpos de contexto omitidos não estão disponíveis nos hunks do patch analisado, então a linha pode aparecer sem controles de expansão. Esse é o comportamento esperado.
- `expandUnchanged` se aplica apenas quando existe contexto expansível.

## Padrões do Plugin

Defina padrões globais do Plugin em `~/.openclaw/openclaw.json`:

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

Configuração persistente de URL do visualizador:

- `viewerBaseUrl` (`string`, opcional)
  - Fallback pertencente ao Plugin para links retornados do visualizador quando uma chamada da ferramenta não passa `baseUrl`.
  - Deve ser `http` ou `https`, sem query/hash.

Exemplo:

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

- `security.allowRemoteViewer` (`boolean`, padrão `false`)
  - `false`: solicitações fora de loopback para rotas do visualizador são negadas.
  - `true`: visualizadores remotos são permitidos se o caminho tokenizado for válido.

Exemplo:

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

- Artefatos são armazenados na subpasta temporária: `$TMPDIR/openclaw-diffs`.
- Os metadados do artefato do visualizador contêm:
  - ID aleatório do artefato (20 caracteres hex)
  - token aleatório (48 caracteres hex)
  - `createdAt` e `expiresAt`
  - caminho armazenado de `viewer.html`
- O TTL padrão do artefato é 30 minutos quando não especificado.
- O TTL máximo aceito para o visualizador é 6 horas.
- A limpeza é executada de forma oportunista após a criação do artefato.
- Artefatos expirados são excluídos.
- A limpeza de fallback remove pastas obsoletas com mais de 24 horas quando os metadados estão ausentes.

## URL do visualizador e comportamento de rede

Rota do visualizador:

- `/plugins/diffs/view/{artifactId}/{token}`

Ativos do visualizador:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

O documento do visualizador resolve esses ativos em relação à URL do visualizador, então um prefixo opcional de caminho em `baseUrl` é preservado também para essas solicitações de ativos.

Comportamento de construção da URL:

- Se `baseUrl` da chamada da ferramenta for fornecido, ele será usado após validação estrita.
- Caso contrário, se `viewerBaseUrl` do Plugin estiver configurado, ele será usado.
- Sem nenhuma das substituições, a URL do visualizador usa como padrão o loopback `127.0.0.1`.
- Se o modo de bind do gateway for `custom` e `gateway.customBindHost` estiver definido, esse host será usado.

Regras de `baseUrl`:

- Deve ser `http://` ou `https://`.
- Query e hash são rejeitados.
- Origem mais caminho base opcional são permitidos.

## Modelo de segurança

Reforço do visualizador:

- Apenas loopback por padrão.
- Caminhos de visualizador tokenizados com validação estrita de ID e token.
- CSP da resposta do visualizador:
  - `default-src 'none'`
  - scripts e ativos apenas de self
  - sem `connect-src` de saída
- Limitação de falhas remotas quando o acesso remoto está ativado:
  - 40 falhas por 60 segundos
  - bloqueio de 60 segundos (`429 Too Many Requests`)

Reforço da renderização de arquivo:

- O roteamento de solicitações do navegador de screenshot é deny-by-default.
- Somente ativos locais do visualizador de `http://127.0.0.1/plugins/diffs/assets/*` são permitidos.
- Solicitações de rede externas são bloqueadas.

## Requisitos de navegador para modo de arquivo

`mode: "file"` e `mode: "both"` exigem um navegador compatível com Chromium.

Ordem de resolução:

1. `browser.executablePath` na configuração do OpenClaw.
2. Variáveis de ambiente:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Fallback de descoberta por comando/caminho da plataforma.

Texto comum de falha:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrija instalando Chrome, Chromium, Edge ou Brave, ou definindo uma das opções de caminho do executável acima.

## Solução de problemas

Erros de validação de entrada:

- `Provide patch or both before and after text.`
  - Inclua `before` e `after`, ou forneça `patch`.
- `Provide either patch or before/after input, not both.`
  - Não misture modos de entrada.
- `Invalid baseUrl: ...`
  - Use origem `http(s)` com caminho opcional, sem query/hash.
- `{field} exceeds maximum size (...)`
  - Reduza o tamanho do payload.
- Rejeição de patch grande
  - Reduza a contagem de arquivos do patch ou o total de linhas.

Problemas de acessibilidade do visualizador:

- A URL do visualizador usa `127.0.0.1` como padrão.
- Para cenários de acesso remoto, você pode:
  - definir `viewerBaseUrl` no Plugin, ou
  - passar `baseUrl` por chamada da ferramenta, ou
  - usar `gateway.bind=custom` e `gateway.customBindHost`
- Se `gateway.trustedProxies` incluir loopback para um proxy no mesmo host (por exemplo Tailscale Serve), solicitações brutas de visualizador em loopback sem cabeçalhos encaminhados de IP do cliente falham de forma fechada por projeto.
- Para essa topologia de proxy:
  - prefira `mode: "file"` ou `mode: "both"` quando você só precisar de um anexo, ou
  - ative intencionalmente `security.allowRemoteViewer` e defina `viewerBaseUrl` no Plugin ou passe um `baseUrl` de proxy/público quando precisar de uma URL compartilhável do visualizador
- Ative `security.allowRemoteViewer` apenas quando você pretender acesso externo ao visualizador.

A linha de linhas não modificadas não tem botão de expansão:

- Isso pode acontecer para entrada de patch quando o patch não carrega contexto expansível.
- Isso é esperado e não indica falha do visualizador.

Artefato não encontrado:

- O artefato expirou devido ao TTL.
- O token ou caminho mudou.
- A limpeza removeu dados obsoletos.

## Orientação operacional

- Prefira `mode: "view"` para revisões interativas locais em canvas.
- Prefira `mode: "file"` para canais de chat de saída que precisam de um anexo.
- Mantenha `allowRemoteViewer` desativado, a menos que sua implantação exija URLs remotas de visualizador.
- Defina `ttlSeconds` curto e explícito para diffs sensíveis.
- Evite enviar segredos na entrada do diff quando isso não for necessário.
- Se o seu canal comprime imagens de forma agressiva (por exemplo Telegram ou WhatsApp), prefira saída em PDF (`fileFormat: "pdf"`).

Mecanismo de renderização de diff:

- Desenvolvido por [Diffs](https://diffs.com).

## Documentos relacionados

- [Visão geral das ferramentas](/pt-BR/tools)
- [Plugins](/pt-BR/tools/plugin)
- [Navegador](/pt-BR/tools/browser)
