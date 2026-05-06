---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização do Plugin, do doctor ou de instalação pelo gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de Plugin incluídos
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-05-06T09:06:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolução de dependências de Plugin

O OpenClaw mantém o trabalho de dependências de plugins no momento de instalação/atualização. O carregamento em tempo de execução
não executa gerenciadores de pacotes, repara árvores de dependências nem modifica o diretório de
pacotes do OpenClaw.

## Divisão de responsabilidades

Os pacotes de Plugin são responsáveis pelo próprio grafo de dependências:

- as dependências de tempo de execução ficam em `dependencies` ou
  `optionalDependencies` do pacote de Plugin
- importações do SDK/núcleo são pares ou importações fornecidas pelo OpenClaw
- plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- plugins npm e git são instalados em raízes de pacote pertencentes ao OpenClaw

O OpenClaw é responsável apenas pelo ciclo de vida do Plugin:

- descobrir a origem do Plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados de instalação
- carregar o ponto de entrada do Plugin
- falhar com um erro acionável quando dependências estiverem ausentes

## Raízes de instalação

O OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em `~/.openclaw/npm`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm são executadas na raiz npm com:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa essa mesma raiz npm gerenciada
para um tarball npm-pack local. O OpenClaw lê os metadados npm do tarball, adiciona-o
à raiz gerenciada como uma dependência `file:` copiada, executa a instalação npm normal
e então verifica os metadados do lockfile instalado antes de confiar no Plugin.
Isso é destinado a provas de aceitação de pacote e candidato a lançamento em que um
artefato de pacote local deve se comportar como o artefato de registro que ele simula.

O npm pode içar dependências transitivas para `~/.openclaw/npm/node_modules` ao lado
do pacote de Plugin. O OpenClaw examina a raiz npm gerenciada antes de confiar na
instalação e usa o npm para remover pacotes gerenciados pelo npm durante a desinstalação, de modo que dependências
de tempo de execução içadas permaneçam dentro do limite de limpeza gerenciado.

Plugins que importam `openclaw/plugin-sdk/*` declaram `openclaw` como uma dependência
par. O OpenClaw não permite que o npm instale uma cópia separada do pacote hospedeiro
a partir do registro na raiz gerenciada, porque pacotes hospedeiros obsoletos podem afetar a resolução
de pares do npm durante instalações posteriores de plugins. Em vez disso, depois que o npm termina
de modificar a raiz compartilhada durante instalação, atualização ou desinstalação, o OpenClaw reafirma
links `node_modules/openclaw` locais ao Plugin para pacotes instalados que declaram
o par hospedeiro.

Instalações git clonam ou atualizam o repositório e então executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O Plugin instalado então carrega a partir desse diretório de pacote, então a resolução
local ao pacote e do `node_modules` pai funciona da mesma forma que para um pacote
Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. O OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um
Plugin local tiver dependências, instale-as nesse Plugin antes de carregá-lo.

Plugins TypeScript locais de terceiros podem usar o caminho emergencial Jiti. Plugins
JavaScript empacotados e plugins internos incluídos carregam por
import/require nativo em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências de Plugin. Eles leem
os registros de instalação de Plugin, calculam o ponto de entrada e o carregam.

Se uma dependência estiver ausente em tempo de execução, o Plugin falha ao carregar e o erro
deve apontar o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estados de dependência legados gerados pelo OpenClaw e recuperar
plugins baixáveis que estejam ausentes dos registros de instalação locais quando a configuração
os referencia. O Doctor não repara dependências de um Plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e críticos para o núcleo são distribuídos como parte do OpenClaw.
Eles não devem ter uma árvore pesada de dependências de tempo de execução ou devem ser movidos para um
pacote baixável no ClawHub/npm.

Para a lista gerada atual de plugins que são distribuídos no pacote principal, instalados
externamente ou mantidos apenas como código-fonte, consulte [Inventário de Plugin](/pt-BR/plugins/plugin-inventory).

Manifestos de plugins incluídos não devem solicitar preparação de dependências. Funcionalidade grande ou opcional
de Plugin deve ser empacotada como um Plugin normal e instalada pelo
mesmo caminho npm/git/ClawHub que plugins de terceiros.

Em checkouts de código-fonte, o OpenClaw trata o repositório como um monorepo pnpm. Após
`pnpm install`, plugins incluídos carregam a partir de `extensions/<id>`, de modo que dependências
locais ao pacote do workspace ficam disponíveis e edições são aplicadas diretamente. O desenvolvimento
em checkout de código-fonte é apenas com pnpm; `npm install` simples na raiz do repositório
não é uma forma compatível de preparar dependências de plugins incluídos.

| Formato de instalação            | Localização do Plugin incluído         | Responsável pela dependência                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de tempo de execução compilada dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de Plugin |
| Checkout git mais `pnpm install` | Pacotes de workspace `extensions/<id>` | O workspace pnpm, incluindo as próprias dependências de cada pacote de Plugin |
| `openclaw plugins install ...`   | Raiz gerenciada de Plugin npm/git/ClawHub | O fluxo de instalação/atualização de Plugin                          |

## Limpeza legada

Versões antigas do OpenClaw geravam raízes de dependências de plugins incluídos na inicialização ou
durante reparo pelo doctor. A limpeza atual do doctor remove esses diretórios e
symlinks obsoletos quando `--fix` é usado, incluindo raízes `plugin-runtime-deps` antigas, symlinks
de pacotes com prefixo global Node que apontam para destinos `plugin-runtime-deps` podados,
manifestos `.openclaw-runtime-deps*`, `node_modules` de Plugin gerado, diretórios
de estágio de instalação e stores pnpm locais ao pacote. O postinstall empacotado também
remove esses symlinks globais antes de podar as raízes de destino legadas, para que upgrades
não deixem importações de pacotes ESM pendentes.

Esses caminhos são apenas detritos legados. Novas instalações não devem criá-los.
