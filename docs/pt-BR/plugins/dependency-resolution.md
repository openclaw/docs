---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização de Plugin, do doctor ou de instalação do gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de Plugin incluídos
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-05-02T20:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolução de dependências de Plugin

O OpenClaw mantém o trabalho de dependências de Plugin no momento de instalação/atualização. O carregamento em runtime
não executa gerenciadores de pacotes, repara árvores de dependências nem modifica o diretório de pacotes do OpenClaw.

## Divisão de responsabilidades

Os pacotes de Plugin são responsáveis pelo próprio grafo de dependências:

- dependências de runtime ficam em `dependencies` ou
  `optionalDependencies` do pacote de Plugin
- imports do SDK/core são peers ou imports fornecidos pelo OpenClaw
- Plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- Plugins npm e git são instalados em raízes de pacotes pertencentes ao OpenClaw

O OpenClaw é responsável apenas pelo ciclo de vida do Plugin:

- descobrir a origem do Plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados da instalação
- carregar o ponto de entrada do Plugin
- falhar com um erro acionável quando houver dependências ausentes

## Raízes de instalação

O OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em `~/.openclaw/npm`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm são executadas na raiz npm com:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

O npm pode içar dependências transitivas para `~/.openclaw/npm/node_modules` ao lado
do pacote de Plugin. O OpenClaw examina a raiz npm gerenciada antes de confiar na
instalação e usa npm para remover pacotes gerenciados por npm durante a desinstalação, então dependências
de runtime içadas permanecem dentro do limite de limpeza gerenciada.

Instalações git clonam ou atualizam o repositório e, em seguida, executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O Plugin instalado então é carregado desse diretório de pacote, de modo que a resolução em `node_modules`
local do pacote e pai funciona da mesma forma que em um pacote Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. O OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um
Plugin local tiver dependências, instale-as nesse Plugin antes de carregá-lo.

Plugins locais TypeScript de terceiros podem usar o caminho emergencial Jiti. Plugins
JavaScript empacotados e Plugins internos incluídos são carregados por
import/require nativo em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências de Plugin. Eles leem
os registros de instalação de Plugin, calculam o ponto de entrada e o carregam.

Se uma dependência estiver ausente em runtime, o Plugin falha ao carregar e o erro
deve apontar o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado de dependências legado gerado pelo OpenClaw e instalar
Plugins baixáveis configurados que estejam ausentes dos registros de instalação locais.
Ele não repara dependências de um Plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e críticos para o core são distribuídos como parte do OpenClaw.
Eles não devem ter uma árvore pesada de dependências de runtime ou devem ser movidos para um
pacote baixável no ClawHub/npm.

Para a lista gerada atual de Plugins que são distribuídos no pacote core, instalados
externamente ou mantidos apenas como código-fonte, consulte [Inventário de Plugin](/pt-BR/plugins/plugin-inventory).

Manifestos de Plugin incluídos não devem solicitar preparação de dependências. Funcionalidades de Plugin grandes ou opcionais
devem ser empacotadas como um Plugin normal e instaladas pelo
mesmo caminho npm/git/ClawHub que Plugins de terceiros.

Em checkouts de código-fonte, o OpenClaw trata o repositório como um monorepo pnpm. Após
`pnpm install`, Plugins incluídos carregam de `extensions/<id>`, de modo que dependências de workspace
locais do pacote ficam disponíveis e edições são captadas diretamente. O desenvolvimento em checkout de código-fonte
é somente pnpm; `npm install` simples na raiz do repositório
não é uma forma compatível de preparar dependências de Plugin incluído.

| Forma de instalação              | Local do Plugin incluído              | Responsável pelas dependências                                      |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de runtime compilada dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de Plugin |
| Checkout git mais `pnpm install` | Pacotes workspace em `extensions/<id>` | O workspace pnpm, incluindo as dependências próprias de cada pacote de Plugin |
| `openclaw plugins install ...`   | Raiz de Plugin gerenciada por npm/git/ClawHub | O fluxo de instalação/atualização de Plugin                         |

## Limpeza legada

Versões mais antigas do OpenClaw geravam raízes de dependências de Plugin incluído na inicialização ou
durante o reparo do doctor. A limpeza atual do doctor remove esses diretórios obsoletos e
symlinks quando `--fix` é usado, incluindo raízes antigas `plugin-runtime-deps`,
manifestos `.openclaw-runtime-deps*`, `node_modules` de Plugin gerado, diretórios de estágio de
instalação e stores pnpm locais do pacote.

Esses caminhos são apenas resíduos legados. Novas instalações não devem criá-los.
