---
read_when:
    - Você quer alternar entre estável/beta/dev
    - Você quer fixar uma versão, tag ou SHA específica
    - Você está criando tags ou publicando pré-lançamentos
sidebarTitle: Release Channels
summary: 'Canais estável, beta e de desenvolvimento: semântica, alternância, fixação e marcação'
title: Canais de lançamento
x-i18n:
    generated_at: "2026-05-07T01:52:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw oferece três canais de atualização:

- **stable**: dist-tag npm `latest`. Recomendado para a maioria dos usuários.
- **beta**: dist-tag npm `beta` quando estiver atual; se beta estiver ausente ou for mais antigo que
  a versão estável mais recente, o fluxo de atualização volta para `latest`.
- **dev**: ponta móvel de `main` (git). dist-tag npm: `dev` (quando publicado).
  A branch `main` é para experimentação e desenvolvimento ativo. Ela pode conter
  recursos incompletos ou alterações incompatíveis. Não a use para gateways de produção.

Normalmente lançamos builds estáveis em **beta** primeiro, testamos ali e depois executamos uma
etapa explícita de promoção que move a build validada para `latest` sem
alterar o número da versão. Mantenedores também podem publicar uma versão estável
diretamente em `latest` quando necessário. Dist-tags são a fonte da verdade para
instalações npm.

## Linhas mensais de suporte planejadas

OpenClaw ainda não oferece um canal LTS ou de suporte mensal. Estamos trabalhando
em direção a linhas mensais de suporte compatíveis com SemVer para que usuários possam permanecer em uma linha mais tranquila
enquanto `latest` continua avançando rapidamente.

O formato de versão planejado é `YYYY.M.PATCH`:

- `YYYY` é o ano.
- `M` é a linha de lançamento mensal, sem zero à esquerda.
- `PATCH` incrementa dentro dessa linha mensal e pode passar de 100 se necessário.

Exemplos de tags futuras:

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` para a linha de junho.
- `v2026.6.3-beta.1` para uma pré-versão no trem rápido/latest.
- Uma futura dist-tag de linha de suporte, como `stable-2026-6` ou `lts-2026-6`, pode
  apontar para uma linha mensal, mas nenhum canal desse tipo está disponível hoje.

Até essa migração chegar, os canais públicos de atualização continuam sendo `stable`, `beta`
e `dev`.

## Alternando canais

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` persiste sua escolha na configuração (`update.channel`) e alinha o
método de instalação:

- **`stable`** (instalações por pacote): atualiza via dist-tag npm `latest`.
- **`beta`** (instalações por pacote): prefere a dist-tag npm `beta`, mas volta para
  `latest` quando `beta` está ausente ou é mais antiga que a tag estável atual.
- **`stable`** (instalações via git): faz checkout da tag git estável mais recente.
- **`beta`** (instalações via git): prefere a tag git beta mais recente, mas volta para
  a tag git estável mais recente quando beta está ausente ou é mais antiga.
- **`dev`**: garante um checkout git (padrão `~/openclaw`, sobrescreva com
  `OPENCLAW_GIT_DIR`), alterna para `main`, faz rebase no upstream, compila e
  instala a CLI global a partir desse checkout.

<Tip>
Se você quiser stable e dev em paralelo, mantenha dois clones e aponte seu gateway para o estável.
</Tip>

## Direcionamento pontual de versão ou tag

Use `--tag` para direcionar uma dist-tag, versão ou especificação de pacote específica para uma única
atualização **sem** alterar seu canal persistido:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Observações:

- `--tag` se aplica **somente a instalações por pacote (npm)**. Instalações via git a ignoram.
- A tag não é persistida. Seu próximo `openclaw update` usa seu canal configurado
  normalmente.
- Proteção contra downgrade: se a versão de destino for mais antiga que sua versão atual,
  OpenClaw solicita confirmação (ignore com `--yes`).
- `--channel beta` é diferente de `--tag beta`: o fluxo de canal pode voltar
  para stable/latest quando beta está ausente ou é mais antigo, enquanto `--tag beta` direciona a
  dist-tag `beta` bruta para essa execução única.

## Simulação

Visualize o que `openclaw update` faria sem fazer alterações:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

A simulação mostra o canal efetivo, a versão de destino, as ações planejadas e
se uma confirmação de downgrade seria necessária.

## Plugins e canais

Quando você alterna canais com `openclaw update`, OpenClaw também sincroniza as
fontes dos plugins:

- `dev` prefere plugins incluídos no checkout git.
- `stable` e `beta` restauram pacotes de plugins instalados via npm.
- Plugins instalados via npm são atualizados depois que a atualização do núcleo é concluída.

## Verificando o status atual

```bash
openclaw update status
```

Mostra o canal ativo, o tipo de instalação (git ou pacote), a versão atual e a
fonte (configuração, tag git, branch git ou padrão).

## Boas práticas de tagging

- Crie tags para versões nas quais você quer que checkouts git parem (`vYYYY.M.D` para versões estáveis
  atuais, `vYYYY.M.D-beta.N` para versões beta atuais).
- `vYYYY.M.D.beta.N` também é reconhecido por compatibilidade, mas prefira `-beta.N`.
- Tags legadas `vYYYY.M.D-<patch>` ainda são reconhecidas como estáveis (não beta),
  mas o modelo mensal de suporte planejado usará números de patch normais
  (`vYYYY.M.PATCH`) em vez de um sufixo de correção com hífen.
- Mantenha tags imutáveis: nunca mova nem reutilize uma tag.
- As dist-tags npm continuam sendo a fonte da verdade para instalações npm:
  - `latest` -> stable
  - `beta` -> build candidata ou build estável beta-first
  - `dev` -> snapshot da main (opcional)

## Disponibilidade do app macOS

Builds beta e dev podem **não** incluir uma versão do app macOS. Isso está OK:

- A tag git e a dist-tag npm ainda podem ser publicadas.
- Informe "sem build macOS para este beta" nas notas de versão ou no changelog.

## Relacionado

- [Atualização](/pt-BR/install/updating)
- [Internos do instalador](/pt-BR/install/installer)
