import { Link } from "react-router";

interface HeaderLinkProps {
    to: string;
    children: string;
}

export default function HeaderLink(props: HeaderLinkProps) {
    const { to, children } = props
    /**
     * 
     * .topbar-crumb {
      font-size: 9px;
      color: var(--text-darker);
      letter-spacing: 0.06em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
     */
    return (
        <Link to={to} style={{ fontSize: "9px", color: "var(--text-darker)", textDecoration: "none", letterSpacing: "0.06em" }}>{children}</Link>
    )
}