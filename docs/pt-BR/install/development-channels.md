---
read_when:
    - Você quer alternar entre stable/beta/dev
    - Você quer fixar uma versão, tag ou SHA específico/a
    - Você está marcando com tags ou publicando pré-lançamentos
sidebarTitle: Release Channels
summary: 'Canais stable, beta e dev: semântica, troca, fixação e marcação com tags'
title: Canais de versão
x-i18n:
    generated_at: "2026-04-24T05:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# Canais de desenvolvimento

O OpenClaw oferece três canais de atualização:

- **stable**: npm dist-tag `latest`. Recomendado para a maioria dos usuários.
- **beta**: npm dist-tag `beta` quando está atual; se `beta` estiver ausente ou mais antigo que
  a versão stable mais recente, o fluxo de atualização recorre a `latest`.
- **dev**: head móvel de `main` (git). npm dist-tag: `dev` (quando publicado).
  O branch `main` é para experimentação e desenvolvimento ativo. Ele pode conter
  recursos incompletos ou mudanças incompatíveis. Não o use em gateways de produção.

Normalmente, lançamos builds stable em **beta** primeiro, testamos lá e depois executamos uma
etapa explícita de promoção que move o build validado para `latest` sem
alterar o número da versão. Os mantenedores também podem publicar uma versão stable
diretamente em `latest` quando necessário. Dist-tags são a fonte da verdade para
instalações npm.

## Alternando canais

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` persiste sua escolha na configuração (`update.channel`) e alinha o
método de instalação:

- **`stable`** (instalações por pacote): atualiza via npm dist-tag `latest`.
- **`beta`** (instalações por pacote): prefere npm dist-tag `beta`, mas recorre a
  `latest` quando `beta` está ausente ou mais antigo que a tag stable atual.
- **`stable`** (instalações git): faz checkout da tag git stable mais recente.
- **`beta`** (instalações git): prefere a tag git beta mais recente, mas recorre à
  tag git stable mais recente quando beta está ausente ou mais antigo.
- **`dev`**: garante um checkout git (padrão `~/openclaw`, substitua com
  `OPENCLAW_GIT_DIR`), troca para `main`, faz rebase no upstream, compila e
  instala a CLI global a partir desse checkout.

Dica: se você quiser stable + dev em paralelo, mantenha dois clones e aponte seu
gateway para o stable.

## Direcionamento pontual por versão ou tag

Use `--tag` para direcionar uma dist-tag, versão ou especificação de pacote específica em uma
única atualização **sem** alterar seu canal persistido:

```bash
# Instala uma versão específica
openclaw update --tag 2026.4.1-beta.1

# Instala a partir da dist-tag beta (pontual, não persiste)
openclaw update --tag beta

# Instala a partir do branch main do GitHub (tarball npm)
openclaw update --tag main

# Instala uma especificação específica de pacote npm
openclaw update --tag openclaw@2026.4.1-beta.1
```

Observações:

- `--tag` aplica-se **somente a instalações por pacote (npm)**. Instalações git o ignoram.
- A tag não é persistida. Seu próximo `openclaw update` usará seu
  canal configurado normalmente.
- Proteção contra downgrade: se a versão de destino for mais antiga que sua versão atual,
  o OpenClaw pedirá confirmação (ignore com `--yes`).
- `--channel beta` é diferente de `--tag beta`: o fluxo de canal pode recorrer
  a stable/latest quando beta está ausente ou mais antigo, enquanto `--tag beta` direciona a
  dist-tag `beta` bruta nessa única execução.

## Simulação

Visualize o que `openclaw update` faria sem realizar alterações:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

A simulação mostra o canal efetivo, a versão de destino, as ações planejadas e
se seria necessária confirmação de downgrade.

## Plugins e canais

Quando você alterna canais com `openclaw update`, o OpenClaw também sincroniza as
origens de Plugin:

- `dev` prefere Plugins incluídos do checkout git.
- `stable` e `beta` restauram pacotes de Plugin instalados por npm.
- Plugins instalados por npm são atualizados depois que a atualização do core é concluída.

## Verificando o status atual

```bash
openclaw update status
```

Mostra o canal ativo, tipo de instalação (git ou pacote), versão atual e
origem (configuração, tag git, branch git ou padrão).

## Boas práticas de marcação com tags

- Marque com tags as versões para as quais você quer que checkouts git apontem (`vYYYY.M.D` para stable,
  `vYYYY.M.D-beta.N` para beta).
- `vYYYY.M.D.beta.N` também é reconhecido por compatibilidade, mas prefira `-beta.N`.
- Tags legadas `vYYYY.M.D-<patch>` ainda são reconhecidas como stable (não-beta).
- Mantenha tags imutáveis: nunca mova ou reutilize uma tag.
- npm dist-tags continuam sendo a fonte da verdade para instalações npm:
  - `latest` -> stable
  - `beta` -> build candidato ou build stable publicado primeiro em beta
  - `dev` -> snapshot de main (opcional)

## Disponibilidade do app para macOS

Builds beta e dev podem **não** incluir uma versão do app para macOS. Isso é aceitável:

- A tag git e a npm dist-tag ainda podem ser publicadas.
- Destaque "sem build para macOS neste beta" nas notas de versão ou changelog.

## Relacionado

- [Atualizando](/pt-BR/install/updating)
- [Internals do instalador](/pt-BR/install/installer)
