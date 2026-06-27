---
read_when:
    - Você quer alternar entre stable/beta/dev
    - Você quer fixar uma versão, tag ou SHA específica
    - Você está marcando ou publicando pré-lançamentos
sidebarTitle: Release Channels
summary: 'Canais estável, beta e dev: semântica, troca, fixação e marcação'
title: Canais de lançamento
x-i18n:
    generated_at: "2026-06-27T17:37:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw distribui três canais de atualização:

- **stable**: dist-tag npm `latest`. Recomendado para a maioria dos usuários.
- **beta**: dist-tag npm `beta` quando está atual; se o beta estiver ausente ou for mais antigo que
  a versão estável mais recente, o fluxo de atualização recorre a `latest`.
- **dev**: ponta móvel de `main` (git). dist-tag npm: `dev` (quando publicado).
  A branch `main` é para experimentação e desenvolvimento ativo. Ela pode conter
  recursos incompletos ou alterações incompatíveis. Não a use para gateways de produção.

Normalmente publicamos builds estáveis primeiro em **beta**, testamos lá e então executamos uma
etapa explícita de promoção que move o build validado para `latest` sem
alterar o número da versão. Os mantenedores também podem publicar uma versão estável
diretamente em `latest` quando necessário. Dist-tags são a fonte da verdade para instalações npm.

## Alternando canais

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` persiste sua escolha na configuração (`update.channel`) e alinha o
método de instalação:

- **`stable`** (instalações por pacote): atualiza via dist-tag npm `latest`.
- **`beta`** (instalações por pacote): prefere a dist-tag npm `beta`, mas recorre a
  `latest` quando `beta` está ausente ou é mais antigo que a tag estável atual.
- **`stable`** (instalações git): faz checkout da tag git estável mais recente, excluindo
  tags de pré-lançamento semver como `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` e outros sufixos de
  pré-lançamento.
- **`beta`** (instalações git): prefere a tag git beta mais recente, mas recorre à
  tag git estável mais recente quando o beta está ausente ou é mais antigo.
- **`dev`**: garante um checkout git (padrão `~/openclaw`, ou
  `$OPENCLAW_HOME/openclaw` quando `OPENCLAW_HOME` está definido; substitua com
  `OPENCLAW_GIT_DIR`), alterna para `main`, faz rebase no upstream, compila e
  instala a CLI global a partir desse checkout.

<Tip>
Se quiser stable e dev em paralelo, mantenha dois clones e aponte seu gateway para o estável.
</Tip>

## Direcionamento avulso de versão ou tag

Use `--tag` para direcionar uma dist-tag, versão ou especificação de pacote específica para uma única
atualização **sem** alterar seu canal persistido:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Observações:

- `--tag` se aplica somente a **instalações por pacote (npm)**. Instalações git o ignoram.
- A tag não é persistida. Seu próximo `openclaw update` usa seu canal configurado
  como de costume.
- Para instalações por pacote, o OpenClaw pré-empacota especificações de origem GitHub/git em um
  tarball temporário antes da instalação npm em staging. Use `--channel dev` ou
  `--install-method git --version main` quando quiser o checkout móvel de `main`
  como sua instalação persistente.
- Proteção contra downgrade: se a versão de destino for mais antiga que sua versão atual,
  o OpenClaw solicita confirmação (ignore com `--yes`).
- `--channel beta` é diferente de `--tag beta`: o fluxo do canal pode recorrer
  a stable/latest quando o beta está ausente ou é mais antigo, enquanto `--tag beta` direciona a
  dist-tag bruta `beta` para aquela execução.

## Simulação

Pré-visualize o que `openclaw update` faria sem aplicar alterações:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

A simulação mostra o canal efetivo, a versão de destino, as ações planejadas e
se uma confirmação de downgrade seria necessária.

## Plugins e canais

Quando você alterna canais com `openclaw update`, o OpenClaw também sincroniza fontes de plugins:

- `dev` prefere plugins incluídos do checkout git.
- `stable` e `beta` restauram pacotes de plugins instalados via npm.
- Plugins instalados via npm são atualizados depois que a atualização do core é concluída.

## Verificando o status atual

```bash
openclaw update status
```

Mostra o canal ativo, o tipo de instalação (git ou pacote), a versão atual e
a fonte (configuração, tag git, branch git ou padrão).

## Boas práticas de tags

- Marque releases nos quais você quer que checkouts git parem (`vYYYY.M.PATCH` para stable,
  `vYYYY.M.PATCH-beta.N` para beta; sufixos nomeados de pré-lançamento semver como
  `-alpha.N`, `-rc.N` e `-next.N` não são alvos estáveis).
- Tags estáveis numéricas legadas como `vYYYY.M.PATCH-1` e `v1.0.1-1` ainda são
  reconhecidas como tags git estáveis para compatibilidade.
- `vYYYY.M.PATCH.beta.N` também é reconhecida por compatibilidade, mas prefira `-beta.N`.
- Mantenha tags imutáveis: nunca mova nem reutilize uma tag.
- Dist-tags npm continuam sendo a fonte da verdade para instalações npm:
  - `latest` -> stable
  - `beta` -> build candidato ou build estável beta-first
  - `dev` -> snapshot de main (opcional)

## Disponibilidade do app para macOS

Builds beta e dev podem **não** incluir uma versão do app para macOS. Isso não é problema:

- A tag git e a dist-tag npm ainda podem ser publicadas.
- Informe "sem build para macOS neste beta" nas notas de release ou no changelog.

## Relacionados

- [Atualização](/pt-BR/install/updating)
- [Internos do instalador](/pt-BR/install/installer)
