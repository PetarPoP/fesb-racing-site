import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react'
import type { Content, Lang } from '~/content'
import { PROJECTS, isPhoto, type Img, type Project, type ProjectId, type VehicleView } from '~/lib/projects'
import { Lightbox } from './Lightbox'
import { cx, tw } from './ui'

/** The short list of vehicles that the home page needs. */
export type VehicleChip = Pick<VehicleView, 'id' | 'project' | 'name' | 'year'> & { cover: Img | null }

const topPad = 'pt-[clamp(104px,12vw,148px)] pb-10 md:pb-16'

/** Project logo: one file per theme, CSS shows the right one. */
function ProjectLogo({ p, className }: { p: Project; className?: string }) {
  return (
    <>
      <img src={p.logo.dark} alt={p.name} className={cx('light:hidden', className)} />
      <img src={p.logo.light} alt="" aria-hidden="true" className={cx('hidden light:block', className)} />
    </>
  )
}

/**
 * A vehicle image on a light "studio" tile in both themes. Renders keep their whole shape (multiply hides a white
 * background), photos fill the frame.
 */
function VehicleImage({ img, alt, sizes, eager, full, className }: { img: Img; alt: string; sizes: string; eager?: boolean; full?: boolean; className?: string }) {
  const photo = isPhoto(img.src)
  return (
    <div className={cx('relative overflow-hidden bg-[radial-gradient(120%_100%_at_50%_30%,#f7f3f1,#ddd5d1)]', className)}>
      <img
        src={img.sm}
        srcSet={img.sm !== img.src ? `${img.sm} 720w, ${img.src} ${img.w}w` : undefined}
        sizes={sizes}
        width={img.w}
        height={img.h}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        data-lb={full ? '' : undefined}
        data-full={full ? img.src : undefined}
        className={cx('absolute inset-0 size-full', photo ? 'object-cover' : 'object-contain p-[6%] mix-blend-multiply')}
      />
    </div>
  )
}

function ProjectLink({ id, lang, className, children }: { id: ProjectId; lang: Lang; className?: string; children: React.ReactNode }) {
  return (
    <Link to="/$lang/projekti/$project" params={{ lang, project: id }} className={className}>
      {children}
    </Link>
  )
}

/** Home section: one card for Formula Student and one for MotoStudent. Each leads to the project page. */
export function ProjectsSection({ c, lang, vehicles }: { c: Content; lang: Lang; vehicles: VehicleChip[] }) {
  return (
    <section id="projekti" className={tw.section}>
      <h2 className={tw.h2}>{c.vehTitle}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-4">
        {PROJECTS.map((p) => {
          const list = vehicles.filter((v) => v.project === p.id)
          return (
            <article key={p.id} className="flex flex-col overflow-hidden rounded-3xl border border-fg/10 bg-panel">
              <div className="relative aspect-[16/10] bg-sunk">
                <img src={p.photo} alt={p.photoAlt[lang]} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-5 p-[clamp(18px,5vw,28px)]">
                <ProjectLogo p={p} className="h-[clamp(56px,7vw,76px)] w-auto self-start" />
                <h3 className="display m-0 text-[clamp(26px,6vw,34px)] leading-none [font-stretch:115%] tracking-[-.02em]">{p.name}</h3>
                <p className={tw.bodyMute}>{p.intro[lang][0]}</p>
                {list.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-mute">{c.projGenerations}</span>
                    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                      {list.map((v) => (
                        <li key={v.id}>
                          <Link
                            to="/$lang/projekti/$project/$vehicle"
                            params={{ lang, project: p.id, vehicle: v.id }}
                            className="press block rounded-full border border-fg/15 px-3 py-1.5 text-sm text-soft hover:border-acc hover:text-acc"
                          >
                            {v.name}
                            {v.year && <span className="text-mute"> · {v.year}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ProjectLink id={p.id} lang={lang} className={cx(tw.btnLight, 'mt-auto flex items-center gap-2 self-start')}>
                  {c.projMore}
                  <ArrowRight size={16} aria-hidden="true" />
                </ProjectLink>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/** A vehicle card on the project page. */
function VehicleCard({ v, lang, c }: { v: VehicleView; lang: Lang; c: Content }) {
  const cover = v.images[0]
  return (
    <Link
      to="/$lang/projekti/$project/$vehicle"
      params={{ lang, project: v.project, vehicle: v.id }}
      aria-label={`${c.vehOpen}: ${v.name}`}
      data-dh="glow"
      data-dh-edge="20"
      className={cx(tw.card, 'group flex flex-col overflow-hidden press hover:border-acc/60 focus-visible:border-acc/60')}
    >
      {cover ? <VehicleImage img={cover} alt={v.name} sizes="(min-width: 900px) 33vw, 100vw" className="aspect-[16/10]" /> : <div className="aspect-[16/10] bg-sunk" />}
      <div className="flex flex-1 flex-col gap-3 p-[clamp(18px,4vw,24px)]">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={cx(tw.cardTitle, 'text-[clamp(26px,2.6vw,32px)] normal-case')}>{v.name}</h3>
          {v.year && <span className="text-sm text-mute">{v.year}</span>}
        </div>
        {v.specs.length > 0 ? (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {v.specs.slice(0, 3).map(([k, val]) => (
              <div key={k} className="contents">
                <dt className="text-mute">{k}</dt>
                <dd className="m-0 text-soft">{val}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="m-0 text-sm text-mute">{c.noSpecs}</p>
        )}
        <span className="mt-auto flex items-center gap-2 pt-2 text-[15px] font-semibold text-fg transition-colors group-hover:text-acc">
          {c.projMore}
          <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

function BackToProjects({ lang, label }: { lang: Lang; label: string }) {
  return (
    <Link to="/$lang" params={{ lang }} hash="projekti" className="group inline-flex items-center gap-2 text-[15px] font-semibold text-mute transition-colors hover:text-acc">
      <ArrowLeft size={16} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  )
}

/** /projekti/<project>: logo, the text from the old site and the vehicles, newest first. */
export function ProjectPage({ project, vehicles, lang, c }: { project: ProjectId; vehicles: VehicleView[]; lang: Lang; c: Content }) {
  const p = PROJECTS.find((x) => x.id === project)!
  return (
    <main className={cx('wrap flex flex-col gap-10', topPad)}>
      <BackToProjects lang={lang} label={c.projAll} />
      <h1 className={tw.h2}>{p.name}</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-[clamp(24px,5vw,64px)]">
        <ProjectLogo p={p} className="max-h-[200px] w-full max-w-[520px] object-contain object-left" />
        <div className="flex flex-col gap-4">
          {p.intro[lang].map((t) => (
            <p key={t.slice(0, 24)} className="m-0 text-[17px] leading-[1.65] text-pretty text-soft">
              {t}
            </p>
          ))}
        </div>
      </div>
      <h2 className="display m-0 mt-6 text-[clamp(28px,4vw,48px)] leading-none">{c.projGenerations}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
        {vehicles.map((v) => (
          <VehicleCard key={v.id} v={v} lang={lang} c={c} />
        ))}
      </div>
    </main>
  )
}

const h3Class = 'display m-0 text-[clamp(22px,2.4vw,28px)] leading-none [font-stretch:115%] tracking-[-.02em]'

/** /projekti/<project>/<vehicle>: cover, technical data, awards, the text of each system and the gallery. */
export function VehiclePage({ v, others, lang, c }: { v: VehicleView; others: VehicleView[]; lang: Lang; c: Content }) {
  const p = PROJECTS.find((x) => x.id === v.project)!
  const gallery = useRef<HTMLElement>(null)
  const [cover, ...rest] = v.images
  return (
    <main className={cx('wrap flex flex-col gap-10', topPad)}>
      <Link
        to="/$lang/projekti/$project"
        params={{ lang, project: p.id }}
        className="group inline-flex items-center gap-2 self-start text-[15px] font-semibold text-mute transition-colors hover:text-acc"
      >
        <ArrowLeft size={16} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5" />
        {p.name}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className={cx(tw.h2, 'normal-case')}>{v.name}</h1>
        {v.year && <span className="display text-[clamp(22px,3vw,36px)] leading-none text-mute">{v.year}</span>}
      </div>

      <section ref={gallery} className="flex flex-col gap-10">
        {cover && <VehicleImage img={cover} alt={v.name} sizes="(min-width: 1280px) 1200px, 100vw" eager full className="aspect-[16/9] rounded-3xl border border-fg/10" />}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-4">
          <div className={cx(tw.card, 'flex flex-col gap-4 p-[clamp(20px,4vw,28px)]')}>
            <h2 className={h3Class}>{c.specsTitle}</h2>
            {v.specs.length > 0 ? (
              <dl className="m-0 flex flex-col">
                {v.specs.map(([k, val]) => (
                  <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-fg/10 py-3 last:border-b-0">
                    <dt className="text-mute">{k}</dt>
                    <dd className="m-0 text-right font-semibold">{val}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={tw.bodyMute}>{c.noSpecs}</p>
            )}
          </div>
          {(v.awards.length > 0 || v.comp) && (
            <div className={cx(tw.card, 'flex flex-col gap-4 p-[clamp(20px,4vw,28px)]')}>
              <h2 className={h3Class}>{v.awards.length > 0 ? c.awardsTitle : c.vehCompTitle}</h2>
              {v.comp?.d && <p className="m-0 text-sm text-mute">{v.comp.d}</p>}
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {[...new Set([...v.awards, ...(v.comp?.items ?? [])])].map((a) => (
                  <li key={a} className="flex gap-3 leading-snug">
                    <Trophy size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-acc" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {v.description && <p className="m-0 max-w-[820px] text-[17px] leading-[1.7] whitespace-pre-line text-soft">{v.description}</p>}
        {v.sections.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-x-10 gap-y-8">
            {v.sections.map((s) => (
              <article key={s.t} className="flex flex-col gap-3">
                <h2 className={h3Class}>{s.t}</h2>
                {s.d.split('\n\n').map((t) => (
                  <p key={t.slice(0, 24)} className="m-0 text-base leading-[1.7] text-pretty text-soft">
                    {t}
                  </p>
                ))}
              </article>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className={h3Class}>{c.galleryTitle}</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3">
              {rest.map((img, i) => (
                <VehicleImage key={img.src} img={img} alt={`${v.name} ${i + 2}`} sizes="(min-width: 900px) 25vw, 50vw" full className="aspect-[4/3] cursor-zoom-in rounded-2xl border border-fg/10" />
              ))}
            </div>
          </div>
        )}
      </section>
      <Lightbox containerRef={gallery} lang={lang} />

      {others.length > 0 && (
        <div className="flex flex-col gap-4 border-t border-fg/[.14] pt-8">
          <h2 className={h3Class}>{c.otherVehicles}</h2>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {others.map((o) => (
              <li key={o.id}>
                <Link
                  to="/$lang/projekti/$project/$vehicle"
                  params={{ lang, project: o.project, vehicle: o.id }}
                  className="press block rounded-full border border-fg/15 px-3.5 py-2 text-sm text-soft hover:border-acc hover:text-acc"
                >
                  {o.name}
                  {o.year && <span className="text-mute"> · {o.year}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
