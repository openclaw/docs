---
read_when:
    - Você está depurando instalações de pacotes de plugins
    - Você está alterando o comportamento de inicialização de plugins, do doctor ou da instalação pelo gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de plugins incluídos no pacote
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de plugins e resolve dependências de plugins
title: Resolução de dependências de Plugins
x-i18n:
    generated_at: "2026-07-12T00:09:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw gerencia as dependências de plugins somente no momento da instalação/atualização. O carregamento em tempo de execução nunca executa um gerenciador de pacotes, repara uma árvore de dependências nem modifica o diretório do pacote OpenClaw.

## Divisão de responsabilidades

Os pacotes de plugins são responsáveis por seu grafo de dependências:

- As dependências de tempo de execução ficam em `dependencies` ou `optionalDependencies` do pacote do plugin.
- As importações do SDK/núcleo são importações peer ou fornecidas pelo OpenClaw.
- Plugins de desenvolvimento local trazem suas próprias dependências já instaladas.
- Plugins npm e git são instalados em raízes de pacotes pertencentes ao OpenClaw.

O OpenClaw é responsável apenas pelo ciclo de vida do plugin:

- Descobrir a origem do plugin.
- Instalar ou atualizar o pacote quando solicitado explicitamente.
- Registrar os metadados da instalação.
- Carregar o ponto de entrada do plugin.
- Falhar com um erro que indique uma ação corretiva quando houver dependências ausentes.

## Raízes de instalação

O OpenClaw usa raízes estáveis por origem:

- Pacotes npm são instalados em projetos individuais por plugin em
  `~/.openclaw/npm/projects/<encoded-package>`.
- Pacotes git são clonados em `~/.openclaw/git`.
- Instalações locais, por caminho ou arquivo compactado são copiadas ou referenciadas sem reparo de dependências.

As instalações npm são executadas na raiz desse projeto individual do plugin com:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa a mesma raiz de projeto npm por plugin para um tarball npm-pack local: o OpenClaw lê os metadados npm do tarball, adiciona-o ao projeto gerenciado como uma dependência `file:` copiada, executa a instalação npm normal acima e, em seguida, verifica os metadados do arquivo de lock instalado antes de confiar no plugin. Esse caminho existe para a aceitação de pacotes e a comprovação de candidatos a lançamento, em que um artefato de pacote local deve se comportar como o artefato do registro que ele simula.

Use `npm-pack:` ao testar pacotes de plugins oficiais ou externos antes da publicação. Uma instalação por arquivo compactado bruto ou caminho é útil para depuração local, mas não comprova o mesmo caminho de dependências de um pacote npm ou ClawHub instalado. `npm-pack:` comprova o formato gerenciado de instalação do pacote; por si só, isso não comprova que o plugin seja conteúdo oficial vinculado ao catálogo.

Quando o comportamento depender do status de plugin incluído ou de plugin oficial confiável, combine a comprovação do pacote local com uma instalação oficial respaldada pelo catálogo ou com um caminho de pacote publicado que registre a confiança oficial. O acesso a auxiliares privilegiados e o tratamento do escopo oficial confiável devem ser validados nesse caminho de instalação confiável, e não inferidos de uma instalação por tarball local.

Se um plugin falhar em tempo de execução devido a uma importação ausente, corrija o manifesto do pacote em vez de reparar manualmente o projeto gerenciado. As importações de tempo de execução devem estar em `dependencies` ou `optionalDependencies` do pacote do plugin; `devDependencies` não são instaladas para projetos gerenciados de tempo de execução. Um `npm install` local dentro de `~/.openclaw/npm/projects/<encoded-package>` pode viabilizar um diagnóstico temporário, mas não serve como comprovação de aceitação do pacote, pois a próxima instalação ou atualização recria o projeto com base nos metadados do pacote.

O npm pode elevar dependências transitivas para o `node_modules` do projeto individual do plugin, ao lado do pacote do plugin. O OpenClaw verifica a raiz do projeto gerenciado antes de confiar na instalação e remove esse projeto durante a desinstalação, portanto as dependências elevadas de tempo de execução permanecem dentro do limite de limpeza desse plugin.

Pacotes de plugins publicados no npm podem incluir `npm-shrinkwrap.json`; o npm usa esse arquivo de lock publicável durante a instalação, e a raiz de projeto npm gerenciado do OpenClaw oferece suporte a ele pelo caminho normal de instalação. Pacotes publicáveis de plugins pertencentes ao OpenClaw devem incluir um shrinkwrap local do pacote, gerado a partir do grafo de dependências publicado desse pacote:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

O gerador remove as `devDependencies` do plugin, aplica a política de substituições do workspace e grava `extensions/<id>/npm-shrinkwrap.json` para cada plugin com `openclaw.release.publishToNpm: true`. Pacotes de plugins de terceiros também podem incluir um shrinkwrap; o OpenClaw não exige um para pacotes da comunidade, mas o npm o respeita quando presente.

Antes de tratar um pacote local como comprovação de candidato a lançamento, inspecione o tarball que será instalado:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Para alterações de dependências, verifique também se uma instalação de produção consegue resolver os pacotes de tempo de execução sem dependências de desenvolvimento:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Pacotes npm de plugins pertencentes ao OpenClaw também podem ser publicados com `bundledDependencies` explícitas. O caminho de publicação npm sobrepõe a lista de nomes das dependências de tempo de execução, remove do manifesto publicado os metadados do workspace usados apenas para desenvolvimento, executa uma instalação npm sem scripts para as dependências locais de tempo de execução do pacote e, em seguida, empacota ou publica o tarball do plugin com os arquivos dessas dependências incluídos. Pacotes com forte dependência de componentes nativos (Codex, ACPX, Copilot, llama.cpp, memory-lancedb, Tlon) desativam esse comportamento com `openclaw.release.bundleRuntimeDependencies: false`; eles ainda incluem um shrinkwrap, mas o npm resolve as dependências de tempo de execução durante a instalação em vez de incorporar no tarball do plugin todos os binários de cada plataforma. O pacote raiz `openclaw` não inclui toda a sua árvore de dependências.

Plugins que importam `openclaw/plugin-sdk/*` declaram `openclaw` como dependência peer. O OpenClaw não permite que o npm instale no projeto gerenciado uma cópia separada do pacote hospedeiro proveniente do registro, pois um pacote hospedeiro desatualizado pode afetar a resolução de dependências peer do npm nesse plugin. As instalações npm gerenciadas ignoram a resolução/materialização de dependências peer pelo npm, e o OpenClaw restabelece os links locais do plugin em `node_modules/openclaw` para pacotes instalados que declaram a dependência peer do hospedeiro, após a instalação ou atualização.

As instalações git clonam ou atualizam o repositório e, em seguida, executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O plugin instalado é então carregado a partir do diretório desse pacote, portanto a resolução em `node_modules` local do pacote e do diretório pai funciona da mesma forma que em um pacote Node normal.

## Plugins locais

Plugins locais são diretórios controlados pelo desenvolvedor. O OpenClaw nunca executa `npm install`, `pnpm install` nem reparo de dependências para eles; se um plugin local tiver dependências, instale-as nesse plugin antes de carregá-lo.

Plugins locais de terceiros escritos em TypeScript são carregados por meio do Jiti como caminho de emergência. Plugins JavaScript empacotados e plugins internos incluídos são carregados por import/require nativo.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento da configuração nunca instalam dependências de plugins. Eles leem os registros de instalação dos plugins, calculam o ponto de entrada e o carregam.

Uma dependência ausente em tempo de execução faz o carregamento do plugin falhar com um erro que orienta o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` limpa o estado legado de dependências gerado pelo OpenClaw e pode recuperar plugins disponíveis para download que estejam ausentes dos registros de instalação locais quando a configuração ainda fizer referência a eles. O Doctor não repara dependências de um plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e essenciais para o núcleo são distribuídos como parte do OpenClaw. Eles não devem ter uma árvore pesada de dependências de tempo de execução ou devem ser movidos para um pacote disponível para download no ClawHub/npm.

Para consultar a lista gerada atual de plugins distribuídos no pacote principal, instalados externamente ou mantidos somente como código-fonte, consulte
[Inventário de plugins](/pt-BR/plugins/plugin-inventory).

Os manifestos de plugins incluídos não devem solicitar preparação de dependências. Funcionalidades grandes ou opcionais de plugins devem ser empacotadas como um plugin normal e instaladas pelo mesmo caminho npm/git/ClawHub usado para plugins de terceiros.

Em checkouts do código-fonte, o OpenClaw trata o repositório como um monorepo pnpm. Após `pnpm install`, os plugins incluídos são carregados de `extensions/<id>`, de modo que as dependências locais dos pacotes do workspace fiquem disponíveis e as alterações sejam aplicadas diretamente. O desenvolvimento em checkouts do código-fonte usa somente pnpm; executar `npm install` simples na raiz do repositório não prepara as dependências dos plugins incluídos.

| Formato da instalação             | Localização do plugin incluído         | Responsável pelas dependências                                          |
| --------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `npm install -g openclaw`         | Árvore de tempo de execução compilada dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de plugins |
| Checkout git mais `pnpm install`  | Pacotes de workspace em `extensions/<id>` | O workspace pnpm, incluindo as dependências próprias de cada pacote de plugin |
| `openclaw plugins install ...`    | Raiz gerenciada npm/git/ClawHub        | O fluxo de instalação/atualização do plugin                             |

## Limpeza de legado

Versões anteriores do OpenClaw geravam raízes de dependências de plugins incluídos durante a inicialização ou o reparo pelo Doctor. A limpeza atual do Doctor remove esses diretórios e links simbólicos obsoletos com `--fix`, incluindo raízes antigas de `plugin-runtime-deps`, links simbólicos de pacotes no prefixo global do Node que apontem para destinos removidos de `plugin-runtime-deps`, manifestos `.openclaw-runtime-deps*`, diretórios `node_modules` gerados para plugins, diretórios intermediários de instalação e armazenamentos pnpm locais dos pacotes. O postinstall do pacote também remove esses links simbólicos globais antes de excluir as raízes de destino legadas, para que as atualizações não deixem importações de pacotes ESM pendentes.

Instalações npm anteriores também usavam uma raiz compartilhada em `~/.openclaw/npm/node_modules`. Os fluxos atuais de instalação, atualização, desinstalação e Doctor ainda reconhecem essa raiz plana legada somente para recuperação e limpeza. Novas instalações npm criam raízes de projeto individuais por plugin.
