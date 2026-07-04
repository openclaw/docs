---
doc-schema-version: 1
read_when:
    - Você quer criar um novo Plugin do OpenClaw
    - Você precisa de um guia de início rápido para desenvolvimento de Plugin
    - Você está escolhendo entre docs de canal, provedor, backend de CLI, ferramenta ou hook
sidebarTitle: Getting Started
summary: Crie seu primeiro Plugin do OpenClaw em minutos
title: Criando plugins
x-i18n:
    generated_at: "2026-07-04T15:11:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins estendem o OpenClaw sem alterar o núcleo. Um plugin pode adicionar um canal de mensagens, provedor de modelo, backend de CLI local, ferramenta de agente, hook, provedor de mídia ou outra capacidade pertencente ao plugin.

Você não precisa adicionar um plugin externo ao repositório do OpenClaw. Publique o pacote no [ClawHub](/pt-BR/clawhub) e os usuários o instalam com:

```bash
openclaw plugins install clawhub:<package-name>
```

Especificações de pacote simples ainda são instaladas pelo npm durante a transição de lançamento. Use o prefixo `clawhub:` quando quiser resolução pelo ClawHub.

## Requisitos

- Use Node 22.19+, Node 23.11+ ou Node 24+ e um gerenciador de pacotes como `npm` ou `pnpm`.
- Tenha familiaridade com módulos ESM do TypeScript.
- Para trabalho em plugin empacotado dentro do repositório, clone o repositório e execute `pnpm install`.
  O desenvolvimento de plugins em checkout de código-fonte usa apenas pnpm porque o OpenClaw carrega plugins empacotados a partir dos pacotes de workspace `extensions/*`.

## Escolha o formato do plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de modelo, mídia, busca, fetch, fala ou tempo real.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Execute uma CLI de IA local por meio do fallback de modelo do OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/pt-BR/plugins/tool-plugins">
    Registre ferramentas de agente.
  </Card>
</CardGroup>

## Início rápido

Crie um plugin de ferramenta mínimo registrando uma ferramenta de agente obrigatória. Este é o formato útil mais curto de plugin e mostra o pacote, o manifesto, o ponto de entrada e a prova local.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Plugins externos publicados devem apontar entradas de runtime para arquivos JavaScript compilados. Consulte [pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) para ver o contrato completo de ponto de entrada.

    Todo plugin precisa de um manifesto, mesmo quando não tem configuração. Ferramentas de runtime devem aparecer em `contracts.tools` para que o OpenClaw possa descobrir a propriedade sem carregar antecipadamente todos os runtimes de plugins. Defina `activation.onStartup` intencionalmente. Este exemplo inicia na inicialização do Gateway.

    Superfícies de plugin confiáveis pelo host também são controladas pelo manifesto e exigem habilitação explícita para plugins instalados. Se um plugin instalado registrar `api.registerAgentToolResultMiddleware(...)`, declare cada runtime de destino em `contracts.agentToolResultMiddleware`. Se ele registrar `api.registerTrustedToolPolicy(...)`, declare cada id de política em `contracts.trustedToolPolicies`. Essas declarações mantêm a inspeção no momento da instalação alinhada com o registro em runtime.

    Para cada campo do manifesto, consulte [manifesto do Plugin](/pt-BR/plugins/manifest).

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Use `definePluginEntry` para plugins que não são de canal. Plugins de canal usam `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Para um plugin instalado ou externo, inspecione o runtime carregado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se o plugin registrar um comando de CLI, execute esse comando também. Por exemplo, um comando de demonstração deve ter uma prova de execução como `openclaw demo-plugin ping`.

    Para um plugin empacotado neste repositório, o OpenClaw descobre pacotes de plugin em checkout de código-fonte pelo workspace `extensions/*`. Execute o teste direcionado mais próximo:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    Antes de publicar um plugin pronto para pacote, teste o mesmo formato de instalação que os usuários receberão. Primeiro adicione uma etapa de build, aponte entradas de runtime como `openclaw.extensions` para JavaScript compilado, como `./dist/index.js`, e garanta que `npm pack` inclua essa saída `dist/`. Entradas de código-fonte TypeScript são apenas para checkouts de código-fonte e caminhos de desenvolvimento local.

    Em seguida, empacote o plugin e instale o tarball com `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa o projeto npm gerenciado por plugin do OpenClaw, então captura erros de dependência de runtime que testes em checkout de código-fonte podem ocultar. Ele comprova o formato do pacote e das dependências, não a confiança oficial vinculada ao catálogo. Imports de runtime devem estar em `dependencies` ou `optionalDependencies`; dependências deixadas apenas em `devDependencies` não serão instaladas para o projeto de runtime gerenciado.

    Não use uma instalação bruta por arquivo/caminho como prova final para comportamento de Plugin oficial ou
    privilegiado. Fontes brutas são úteis para depuração local, mas
    não provam o mesmo caminho de dependência que instalações via npm ou ClawHub. Se
    seu Plugin depende de status confiável de Plugin oficial, adicione uma segunda prova
    por meio de uma instalação oficial baseada em catálogo ou de um caminho de pacote publicado que
    registre confiança oficial. Consulte
    [Resolução de dependências de Plugin](/pt-BR/plugins/dependency-resolution) para
    detalhes sobre raiz de instalação e propriedade de dependências.

  </Step>

  <Step title="Publicar">
    Valide o pacote antes de publicar:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Os snippets canônicos do ClawHub ficam em `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instalar">
    Instale o pacote publicado pelo ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registrando ferramentas

Ferramentas podem ser obrigatórias ou opcionais. Ferramentas obrigatórias estão sempre disponíveis quando o
Plugin está habilitado. Ferramentas opcionais exigem adesão do usuário.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Toda ferramenta registrada com `api.registerTool(...)` também deve ser declarada no
manifesto do Plugin:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Usuários aderem com `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Ferramentas opcionais controlam se uma ferramenta é exposta ao modelo. Use
[solicitações de permissão de Plugin](/pt-BR/plugins/plugin-permission-requests) quando uma ferramenta
ou hook deve pedir aprovação depois que o modelo a seleciona e antes que a
ação seja executada.

Use ferramentas opcionais para efeitos colaterais, binários incomuns ou capacidades que
não devem ser expostas por padrão. Nomes de ferramentas não podem conflitar com ferramentas principais;
conflitos são ignorados e relatados nos diagnósticos do Plugin. Registros malformados,
incluindo descritores de ferramenta sem `parameters`, são ignorados e
relatados da mesma forma. Ferramentas registradas são funções tipadas que o modelo pode chamar
depois que as verificações de política e lista de permissões são aprovadas.

Fábricas de ferramentas recebem um objeto de contexto fornecido pelo runtime. Use `ctx.activeModel`
quando uma ferramenta precisar registrar, exibir ou se adaptar ao modelo ativo do turno
atual. O objeto pode incluir `provider`, `modelId` e `modelRef`. Trate-o como
metadados informativos de runtime, não como uma fronteira de segurança contra o operador
local, código de Plugin instalado ou um runtime do OpenClaw modificado. Ferramentas locais
sensíveis ainda devem exigir uma adesão explícita do Plugin ou operador e falhar de modo fechado
quando os metadados de modelo ativo estiverem ausentes ou forem inadequados.

O manifesto declara propriedade e descoberta; a execução ainda chama a implementação
registrada ativa da ferramenta. Mantenha `toolMetadata.<tool>.optional: true`
alinhado com `api.registerTool(..., { optional: true })` para que o OpenClaw possa evitar
carregar o runtime desse Plugin até que a ferramenta seja explicitamente incluída na lista de permissões.

## Convenções de importação

Importe de subcaminhos focados do SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Não importe do barrel raiz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Dentro do seu pacote de Plugin, use arquivos barrel locais, como `api.ts` e
`runtime-api.ts`, para importações internas. Não importe seu próprio Plugin por meio de um
caminho do SDK. Helpers específicos de provedor devem permanecer no pacote do provedor, a menos que
a interface seja realmente genérica.

Métodos RPC personalizados do Gateway são um ponto de entrada avançado. Mantenha-os em um
prefixo específico do Plugin; namespaces administrativos principais, como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*`, permanecem reservados
e resolvem para `operator.admin`. A ponte
`openclaw/plugin-sdk/gateway-method-runtime` é reservada para rotas HTTP de Plugin
que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para o mapa completo de importações, consulte [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Lista de verificação de pré-envio

<Check>**package.json** tem metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos focados `plugin-sdk/<subpath>`</Check>
<Check>Importações internas usam módulos locais, não autoimportações do SDK</Check>
<Check>Os testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugins dentro do repositório)</Check>

## Testar contra versões beta

1. Acompanhe as tags de lançamento do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine via `Watch` > `Releases`. Tags beta são parecidas com `v2026.3.N-beta.1`. Você também pode ativar notificações para a conta oficial da OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de lançamento.
2. Teste seu Plugin contra a tag beta assim que ela aparecer. A janela antes da versão estável normalmente é de apenas algumas horas.
3. Publique na thread do seu Plugin no canal `plugin-forum` do Discord depois de testar, com `all good` ou informando o que quebrou. Se você ainda não tiver uma thread, crie uma.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra um PR para `main` intitulado `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto na sua thread do Discord. Contribuidores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Bloqueadores com PR são mesclados; bloqueadores sem PR podem ser enviados mesmo assim. Mantenedores acompanham essas threads durante os testes beta.
6. Silêncio significa sinal verde. Se você perder a janela, sua correção provavelmente entrará no próximo ciclo.

## Próximas etapas

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um Plugin de canal de mensagens
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um Plugin de provedor de modelo
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Registre um backend local de CLI de IA
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Mapa de importação e referência da API de registro
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, busca, subagente via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do esquema do manifesto
  </Card>
</CardGroup>

## Relacionado

- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Arquitetura de Plugin](/pt-BR/plugins/architecture)
