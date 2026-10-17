import { useEffect, useState } from 'react'
import Admin from './Admin.jsx'
import { apiRequest } from './api.js'

const navigation = [
  ['Home', 'home'], ['About', 'about'], ['Skills', 'skills'], ['Projects', 'projects'],
  ['Education', 'education'], ['Internship', 'internship'], ['Contact', 'contact'],
]

const skillGroups = [
  { title: 'Programming Languages', skills: ['C', 'C++', 'Java', 'Python'] },
  { title: 'Web Technologies', skills: ['HTML', 'CSS', 'JavaScript'] },
  { title: 'Database / Other Skills', skills: ['SQL'] },
]

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Kamlesh Pandey, home"><span className="wordmark-mark">K</span> Kamlesh Pandey</a>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span />
      </button>
      <nav id="main-navigation" className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Main navigation">
        {navigation.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
      </nav>
    </header>
  )
}

function SectionHeading({ eyebrow, title }) {
  return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
}

function Hero() {
  return (
    <section className="hero section-shell" id="home">
      <div className="hero-content">
        <p className="eyebrow"><span className="status-dot" /> BCA STUDENT · SOFTWARE DEVELOPMENT</p>
        <h1>Kamlesh Pandey<span className="hero-period">.</span></h1>
        <p className="hero-headline">BCA Student <span aria-hidden="true">|</span> Aspiring Software Developer</p>
        <p className="hero-intro">I’m building a strong foundation in programming and software development. I enjoy solving problems, learning new technologies, and turning what I learn into practical projects.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#projects">View Projects <span aria-hidden="true">↗</span></a>
          <a className="button button-secondary" href="#contact">Contact Me</a>
        </div>
      </div>
      <aside className="hero-note" aria-label="Current focus">
        <span className="hero-note-label">CURRENTLY</span>
        <p>Learning, building,<br />and improving with every project.</p>
        <span className="hero-note-line" />
        <span className="hero-note-meta">Galgotias University · 2024—Present</span>
      </aside>
      <a className="scroll-cue" href="#about"><span aria-hidden="true">↓</span> SCROLL TO EXPLORE</a>
    </section>
  )
}

function About() {
  return (
    <section className="section-shell content-section" id="about">
      <SectionHeading eyebrow="ABOUT ME" title="Learning by building." />
      <p className="section-copy about-copy">I’m a Bachelor of Computer Applications student at Galgotias University, where I’m developing my foundation in computing and software development. I’m interested in how programs are designed, how problems can be broken into smaller steps, and how those steps become useful software. My current toolkit includes C, C++, Java, and Python for programming, along with HTML, CSS, JavaScript, and SQL. I enjoy learning by building practical projects: a loan approval prediction project and a typing speed tester have given me ways to apply ideas in code. I’m still growing as a developer, and I value clear fundamentals, curiosity, and steady practice. I’m looking forward to learning more, improving the projects I build, and connecting with others who enjoy making software.</p>
    </section>
  )
}

function Skills() {
  return (
    <section className="section-shell content-section" id="skills">
      <SectionHeading eyebrow="TECHNICAL SKILLS" title="Tools in my toolkit." />
      <div className="skill-groups">
        {skillGroups.map(group => <div className="skill-group" key={group.title}>
          <h3>{group.title}</h3>
          <ul className="skill-list" aria-label={group.title}>{group.skills.map(skill => <li key={skill}>{skill}</li>)}</ul>
        </div>)}
      </div>
    </section>
  )
}

function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadProjects() {
    setLoading(true)
    setError('')
    try { setProjects(await apiRequest('/projects')) }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProjects() }, [])

  return (
    <section className="section-shell content-section" id="projects">
      <SectionHeading eyebrow="PROJECTS" title="A few things I have built." />
      <p className="section-lede">Practical projects that help me apply what I’m learning.</p>
      {loading && <p className="api-state" role="status">Loading projects…</p>}
      {!loading && error && <div className="api-state" role="alert"><p>{error}</p><button className="text-button" type="button" onClick={loadProjects}>Try again</button></div>}
      {!loading && !error && projects.length === 0 && <p className="api-state">There are no projects to show yet. Please check back soon.</p>}
      {!loading && !error && projects.length > 0 && <div className="project-grid">
        {projects.map((project, index) => (
          <article className="project-card" key={project._id}>
            <div className="project-card-top"><span className="project-index">0{index + 1}</span>{project.featured && <span className="featured-label">Featured</span>}</div>
            <h3>{project.title}</h3>
            <p className="project-description">{project.description}</p>
            <ul className="tag-list" aria-label={`${project.title} technologies`}>{project.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
            {(project.githubUrl || project.liveUrl) && <div className="project-links">
              {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>}
              {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live project <span aria-hidden="true">↗</span></a>}
            </div>}
          </article>
        ))}
      </div>}
    </section>
  )
}

function Education() {
  return (
    <section className="section-shell content-section" id="education">
      <SectionHeading eyebrow="EDUCATION" title="Building a strong foundation." />
      <article className="detail-card">
        <div><span className="detail-icon" aria-hidden="true">ED</span><div><h3>Bachelor of Computer Applications (BCA)</h3><p>Galgotias University</p></div></div>
        <p className="detail-meta">2024–Present</p>
      </article>
    </section>
  )
}

function Internship() {
  return (
    <section className="section-shell content-section" id="internship">
      <SectionHeading eyebrow="INTERNSHIP" title="Learning through experience." />
      <article className="detail-card">
        <div><span className="detail-icon" aria-hidden="true">IN</span><div><h3>Full Stack Development Intern</h3><p>Thiranex</p><p className="detail-description">A remote, project-based internship alongside my BCA studies. I’m continuing to build my understanding of software development through this experience.</p></div></div>
        <p className="detail-meta">Remote · Project-based</p>
      </article>
    </section>
  )
}

function Contact() {
  return (
    <section className="section-shell content-section contact-section" id="contact">
      <SectionHeading eyebrow="CONTACT" title="Let’s connect." />
      <p className="section-copy">I’d be glad to connect about software development, projects, and opportunities to learn. You can reach me by email or find me on GitHub and LinkedIn.</p>
      <ul className="contact-list">
        <li><span>Email</span><a href="mailto:pkamlesh.on6@gmail.com">pkamlesh.on6@gmail.com</a></li>
        <li><span>GitHub</span><a href="https://github.com/pandey2309" target="_blank" rel="noopener noreferrer">github.com/pandey2309 <span className="external-label">↗</span></a></li>
        <li><span>LinkedIn</span><a href="https://www.linkedin.com/in/kamlesh-pandey123" target="_blank" rel="noopener noreferrer">linkedin.com/in/kamlesh-pandey123 <span className="external-label">↗</span></a></li>
      </ul>
    </section>
  )
}

function Footer() {
  return <footer className="site-footer section-shell"><a className="wordmark" href="#home"><span className="wordmark-mark">K</span> Kamlesh Pandey</a><p>© {new Date().getFullYear()} Kamlesh Pandey</p><a className="admin-link" href="/admin">Admin</a></footer>
}

export default function App() {
  if (window.location.pathname === '/admin') return <Admin />
  return <><Header /><main><Hero /><About /><Skills /><Projects /><Education /><Internship /><Contact /></main><Footer /></>
}
