---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização do Plugin, do doctor ou da instalação pelo gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de Plugin incluídos
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-05-10T19:42:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

O OpenClaw mantém o trabalho de dependências de plugins no momento de instalação/atualização. O carregamento em runtime
não executa gerenciadores de pacotes, repara árvores de dependências nem modifica o diretório de pacote do OpenClaw.

## Divisão de responsabilidades

Os pacotes de plugins são donos do próprio grafo de dependências:

- dependências de runtime ficam em `dependencies` ou `optionalDependencies`
  do pacote de plugin
- importações do SDK/core são pares ou importações fornecidas pelo OpenClaw
- plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- plugins npm e git são instalados em raízes de pacote pertencentes ao OpenClaw

O OpenClaw é dono apenas do ciclo de vida do plugin:

- descobrir a origem do plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados de instalação
- carregar o entrypoint do plugin
- falhar com um erro acionável quando dependências estiverem ausentes

## Raízes de instalação

O OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em `~/.openclaw/npm`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm são executadas na raiz npm com:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa essa mesma raiz npm gerenciada
para um tarball npm-pack local. O OpenClaw lê os metadados npm do tarball, adiciona-o
à raiz gerenciada como uma dependência `file:` copiada, executa a instalação npm normal
e então verifica os metadados do lockfile instalado antes de confiar no plugin.
Isso é destinado a provas de aceitação de pacote e de candidato a release em que um
artefato pack local deve se comportar como o artefato de registry que ele simula.

O npm pode elevar dependências transitivas para `~/.openclaw/npm/node_modules` ao lado
do pacote de plugin. O OpenClaw verifica a raiz npm gerenciada antes de confiar na
instalação e usa npm para remover pacotes gerenciados por npm durante a desinstalação, portanto dependências
de runtime elevadas permanecem dentro do limite de limpeza gerenciado.

Plugins que importam `openclaw/plugin-sdk/*` declaram `openclaw` como dependência peer.
O OpenClaw não permite que o npm instale uma cópia separada do pacote host vinda do registry
na raiz gerenciada, porque pacotes host obsoletos podem afetar a resolução peer do npm
durante instalações posteriores de plugins. Instalações npm gerenciadas ignoram a resolução/materialização
peer do npm para a raiz compartilhada e o OpenClaw reafirma links `node_modules/openclaw`
locais ao plugin para pacotes instalados que declaram o peer host após instalação, atualização
ou desinstalação.

Instalações git clonam ou atualizam o repositório e então executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O plugin instalado então carrega a partir desse diretório de pacote, portanto a resolução
`node_modules` local ao pacote e do diretório pai funciona da mesma forma que em um pacote
Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. O OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um plugin
local tiver dependências, instale-as nesse plugin antes de carregá-lo.

Plugins TypeScript locais de terceiros podem usar o caminho emergencial Jiti. Plugins
JavaScript empacotados e plugins internos incluídos carregam por import/require nativo
em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências de plugins. Eles leem
os registros de instalação de plugins, calculam o entrypoint e o carregam.

Se uma dependência estiver ausente em runtime, o plugin falha ao carregar e o erro
deve direcionar o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado legado de dependências gerado pelo OpenClaw e recuperar
plugins baixáveis ausentes nos registros de instalação locais quando a configuração
os referencia. O Doctor não repara dependências de um plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e críticos para o core são enviados como parte do OpenClaw.
Eles não devem ter uma árvore pesada de dependências de runtime ou devem ser movidos
para um pacote baixável no ClawHub/npm.

Para a lista gerada atual de plugins que são enviados no pacote core, instalados
externamente ou mantidos apenas como fonte, consulte [Inventário de Plugin](/pt-BR/plugins/plugin-inventory).

Manifestos de plugins incluídos não devem solicitar staging de dependências. Funcionalidades
grandes ou opcionais de plugins devem ser empacotadas como um plugin normal e instaladas
pelo mesmo caminho npm/git/ClawHub que plugins de terceiros.

Em checkouts de código-fonte, o OpenClaw trata o repositório como um monorepo pnpm. Após
`pnpm install`, plugins incluídos carregam de `extensions/<id>`, então dependências
workspace locais ao pacote ficam disponíveis e edições são captadas diretamente. O desenvolvimento
em checkout de código-fonte é somente pnpm; `npm install` simples na raiz do repositório não é
uma forma compatível de preparar dependências de plugins incluídos.

| Formato de instalação            | Local do plugin incluído              | Dono das dependências                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de runtime criada dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de plugins |
| Checkout git mais `pnpm install` | Pacotes workspace `extensions/<id>`   | O workspace pnpm, incluindo as dependências próprias de cada pacote de plugin |
| `openclaw plugins install ...`   | Raiz de plugin gerenciada npm/git/ClawHub | O fluxo de instalação/atualização do plugin                          |

## Limpeza legada

Versões mais antigas do OpenClaw geravam raízes de dependências de plugins incluídos na inicialização ou
durante reparo pelo doctor. A limpeza atual do doctor remove esses diretórios e
symlinks obsoletos quando `--fix` é usado, incluindo raízes antigas `plugin-runtime-deps`, symlinks
de pacote de prefixo global do Node que apontam para alvos `plugin-runtime-deps` removidos,
manifestos `.openclaw-runtime-deps*`, `node_modules` de plugins gerados, diretórios
de estágio de instalação e stores pnpm locais ao pacote. O postinstall empacotado também
remove esses symlinks globais antes de remover as raízes-alvo legadas para que upgrades
não deixem importações pendentes de pacotes ESM.

Esses caminhos são apenas resíduos legados. Novas instalações não devem criá-los.
