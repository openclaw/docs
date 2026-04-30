---
read_when:
    - Você quer alternar entre estável/beta/desenvolvimento
    - Você quer fixar uma versão, tag ou SHA específica
    - Você está criando tags ou publicando pré-lançamentos
sidebarTitle: Release Channels
summary: 'Canais stable, beta e dev: semântica, alternância, fixação e marcação'
title: Canais de lançamento
x-i18n:
    generated_at: "2026-04-30T09:54:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Canais de desenvolvimento

O OpenClaw disponibiliza três canais de atualização:

- **stable**: npm dist-tag `latest`. Recomendado para a maioria dos usuários.
- **beta**: npm dist-tag `beta` quando está atual; se beta estiver ausente ou for mais antigo que
  a versão estável mais recente, o fluxo de atualização volta para `latest`.
- **dev**: ponta móvel do `main` (git). npm dist-tag: `dev` (quando publicado).
  O branch `main` é para experimentação e desenvolvimento ativo. Ele pode conter
  recursos incompletos ou alterações incompatíveis. Não o use em Gateways de produção.

Normalmente publicamos compilações estáveis primeiro em **beta**, testamos ali e então executamos uma
etapa explícita de promoção que move a compilação aprovada para `latest` sem
alterar o número da versão. Mantenedores também podem publicar uma versão estável
diretamente em `latest` quando necessário. Dist-tags são a fonte da verdade para instalações via npm.

## Alternando canais

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` persiste sua escolha na configuração (`update.channel`) e alinha o
método de instalação:

- **`stable`** (instalações por pacote): atualiza via npm dist-tag `latest`.
- **`beta`** (instalações por pacote): prefere o npm dist-tag `beta`, mas volta para
  `latest` quando `beta` está ausente ou é mais antigo que a tag estável atual.
- **`stable`** (instalações via git): faz checkout da tag git estável mais recente.
- **`beta`** (instalações via git): prefere a tag git beta mais recente, mas volta para
  a tag git estável mais recente quando beta está ausente ou é mais antigo.
- **`dev`**: garante um checkout git (padrão `~/openclaw`, substitua com
  `OPENCLAW_GIT_DIR`), alterna para `main`, faz rebase no upstream, compila e
  instala a CLI global a partir desse checkout.

<Tip>
Se você quer stable e dev em paralelo, mantenha dois clones e aponte seu Gateway para o estável.
</Tip>

## Direcionamento pontual para versão ou tag

Use `--tag` para direcionar uma dist-tag, versão ou especificação de pacote específica para uma única
atualização **sem** alterar seu canal persistido:

```bash
# Instalar uma versão específica
openclaw update --tag 2026.4.1-beta.1

# Instalar a partir da dist-tag beta (pontual, não persiste)
openclaw update --tag beta

# Instalar a partir do branch main do GitHub (tarball npm)
openclaw update --tag main

# Instalar uma especificação específica de pacote npm
openclaw update --tag openclaw@2026.4.1-beta.1
```

Observações:

- `--tag` se aplica **somente a instalações por pacote (npm)**. Instalações via git a ignoram.
- A tag não é persistida. Seu próximo `openclaw update` usa seu canal configurado
  como de costume.
- Proteção contra downgrade: se a versão de destino for mais antiga que sua versão atual,
  o OpenClaw solicita confirmação (ignore com `--yes`).
- `--channel beta` é diferente de `--tag beta`: o fluxo de canal pode voltar
  para stable/latest quando beta está ausente ou é mais antigo, enquanto `--tag beta` direciona para a
  dist-tag `beta` bruta nessa execução única.

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

Quando você alterna canais com `openclaw update`, o OpenClaw também sincroniza as origens dos plugins:

- `dev` prefere plugins incluídos no checkout git.
- `stable` e `beta` restauram pacotes de plugins instalados via npm.
- Plugins instalados via npm são atualizados depois que a atualização do núcleo é concluída.

## Verificando o status atual

```bash
openclaw update status
```

Mostra o canal ativo, o tipo de instalação (git ou pacote), a versão atual e a
origem (configuração, tag git, branch git ou padrão).

## Melhores práticas de marcação com tags

- Crie tags para versões nas quais você quer que checkouts git aterrissem (`vYYYY.M.D` para stable,
  `vYYYY.M.D-beta.N` para beta).
- `vYYYY.M.D.beta.N` também é reconhecido por compatibilidade, mas prefira `-beta.N`.
- Tags legadas `vYYYY.M.D-<patch>` ainda são reconhecidas como estáveis (não beta).
- Mantenha tags imutáveis: nunca mova nem reutilize uma tag.
- npm dist-tags continuam sendo a fonte da verdade para instalações via npm:
  - `latest` -> stable
  - `beta` -> compilação candidata ou compilação estável publicada primeiro em beta
  - `dev` -> snapshot do main (opcional)

## Disponibilidade do app para macOS

Compilações beta e dev podem **não** incluir uma versão do app para macOS. Isso é aceitável:

- A tag git e a npm dist-tag ainda podem ser publicadas.
- Mencione "sem build para macOS neste beta" nas notas de versão ou no changelog.

## Relacionado

- [Atualização](/pt-BR/install/updating)
- [Funcionamento interno do instalador](/pt-BR/install/installer)
