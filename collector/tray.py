"""WorkPulse Taskbar System Tray & Quick-Action Status Dialog.

Resides in the Windows Notification Area (hidden icons tray).
Clicking opens a compact status dialog with version info, active telemetry,
and quick actions (Open Dashboard, Pause/Resume, Autostart toggle, and Quit).
"""

import json
import logging
import os
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path
from typing import Callable, Optional

# Handle headless Linux and environments without graphical tray backends
try:
    if sys.platform.startswith("linux") and "PYSTRAY_BACKEND" not in os.environ:
        try:
            import gi
            gi.require_version("AppIndicator3", "0.1")
        except Exception:
            try:
                import Xlib
            except Exception:
                os.environ["PYSTRAY_BACKEND"] = "dummy"

    import pystray
    from pystray import Menu, MenuItem
except Exception as e:
    pystray = None
    Menu = None
    MenuItem = None

from PIL import Image, ImageDraw

from collector.autostart import disable_autostart, enable_autostart, is_autostart_enabled

logger = logging.getLogger("WorkPulseTray")

VERSION = "0.2.0"
APP_TITLE = "WorkPulse"


def create_tray_icon_image(width=64, height=64) -> Image.Image:
    """Generate a crisp WorkPulse tray icon with a cyan lightning pulse on slate background."""
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Dark rounded background
    draw.rounded_rectangle([2, 2, width - 2, height - 2], radius=14, fill=(15, 23, 42, 255))
    draw.rounded_rectangle([2, 2, width - 2, height - 2], radius=14, outline=(56, 189, 248, 200), width=2)

    # Draw cyan lightning pulse (⚡)
    # Coordinates normalized for 64x64
    points = [
        (34, 10),
        (18, 34),
        (31, 34),
        (26, 54),
        (48, 28),
        (35, 28),
        (40, 10),
    ]
    draw.polygon(points, fill=(6, 182, 212, 255))
    return image


class WorkPulseTrayApp:
    """System Tray resident application for WorkPulse."""

    def __init__(
        self,
        api_url: str = "http://localhost:8080",
        on_exit_callback: Optional[Callable[[], None]] = None,
    ):
        self.api_url = api_url.rstrip("/")
        self.on_exit_callback = on_exit_callback
        self.icon: Optional[pystray.Icon] = None
        self.tk_root = None
        self.status_dialog = None
        self.is_monitoring = True
        self._running = True

    def get_backend_status(self) -> dict:
        """Fetch current telemetry and monitoring status from backend."""
        try:
            url = f"{self.api_url}/api/control/status"
            with urllib.request.urlopen(url, timeout=1.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    self.is_monitoring = data.get("isMonitoring", True)
                    return data
        except Exception:
            pass
        return {
            "status": "OFFLINE",
            "isMonitoring": self.is_monitoring,
            "currentApp": "Unknown",
            "currentTitle": "Connecting to backend...",
            "currentSessionActiveSeconds": 0.0,
            "idleSeconds": 0.0,
            "isIdle": False,
        }

    def toggle_monitoring(self):
        """Toggle monitoring state via backend API."""
        endpoint = "/api/control/resume" if not self.is_monitoring else "/api/control/pause"
        try:
            req = urllib.request.Request(f"{self.api_url}{endpoint}", method="POST")
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                if resp.status == 200:
                    self.is_monitoring = not self.is_monitoring
        except Exception as e:
            logger.error(f"Failed to toggle monitoring: {e}")

    def open_dashboard(self):
        """Open the React presentation layer in the default browser."""
        webbrowser.open(self.api_url)

    def show_dialog(self):
        """Display the compact status dialog."""
        if self.tk_root:
            self.tk_root.after(0, self._ensure_dialog_visible)

    def _ensure_dialog_visible(self):
        if not self.status_dialog:
            self._build_tk_dialog()
        self.status_dialog.deiconify()
        self.status_dialog.lift()
        self.status_dialog.focus_force()

    def hide_dialog(self):
        """Hide dialog back to the system tray."""
        if self.status_dialog:
            self.status_dialog.withdraw()

    def toggle_autostart(self):
        """Toggle Windows startup registration."""
        if is_autostart_enabled():
            disable_autostart()
        else:
            enable_autostart()

    def _build_tk_dialog(self):
        """Construct the compact, sleek dark-themed Tkinter status dialog."""
        import tkinter as tk
        from tkinter import ttk

        dialog = tk.Toplevel(self.tk_root)
        dialog.title(f"{APP_TITLE} Status")
        dialog.geometry("380x420")
        dialog.resizable(False, False)
        dialog.configure(bg="#0f172a")

        # Position dialog near bottom-right (above system tray)
        dialog.update_idletasks()
        sw = dialog.winfo_screenwidth()
        sh = dialog.winfo_screenheight()
        dialog.geometry(f"380x420+{sw - 420}+{sh - 520}")

        # Intercept window 'X' close button to hide to tray instead of quitting
        dialog.protocol("WM_DELETE_WINDOW", self.hide_dialog)

        # 1. Header Section
        hdr_frame = tk.Frame(dialog, bg="#0f172a", pady=12, padx=16)
        hdr_frame.pack(fill=tk.X)

        title_lbl = tk.Label(
            hdr_frame,
            text=f"⚡ {APP_TITLE}",
            font=("Segoe UI", 16, "bold"),
            fg="#38bdf8",
            bg="#0f172a",
        )
        title_lbl.pack(side=tk.LEFT)

        ver_lbl = tk.Label(
            hdr_frame,
            text=f"v{VERSION}",
            font=("Segoe UI", 9),
            fg="#94a3b8",
            bg="#0f172a",
        )
        ver_lbl.pack(side=tk.LEFT, padx=8, pady=(4, 0))

        # Status Pill
        self.status_badge = tk.Label(
            hdr_frame,
            text="● Active",
            font=("Segoe UI", 9, "bold"),
            fg="#34d399",
            bg="#064e3b",
            padx=8,
            pady=2,
        )
        self.status_badge.pack(side=tk.RIGHT)

        # 2. Status Card (Dark Slate Container)
        card = tk.Frame(dialog, bg="#1e293b", padx=14, pady=12, highlightthickness=1, highlightbackground="#334155")
        card.pack(fill=tk.X, padx=16, pady=4)

        # Server URL row
        srv_row = tk.Frame(card, bg="#1e293b")
        srv_row.pack(fill=tk.X, pady=2)
        tk.Label(srv_row, text="Endpoint:", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b").pack(side=tk.LEFT)
        self.lbl_server = tk.Label(srv_row, text=self.api_url, font=("Segoe UI", 9, "bold"), fg="#f8fafc", bg="#1e293b")
        self.lbl_server.pack(side=tk.RIGHT)

        # Active App row
        app_row = tk.Frame(card, bg="#1e293b")
        app_row.pack(fill=tk.X, pady=2)
        tk.Label(app_row, text="Active App:", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b").pack(side=tk.LEFT)
        self.lbl_app = tk.Label(app_row, text="Detecting...", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#1e293b")
        self.lbl_app.pack(side=tk.RIGHT)

        # Window Title row
        title_row = tk.Frame(card, bg="#1e293b")
        title_row.pack(fill=tk.X, pady=2)
        tk.Label(title_row, text="Window:", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b").pack(side=tk.LEFT)
        self.lbl_title = tk.Label(title_row, text="...", font=("Segoe UI", 8), fg="#cbd5e1", bg="#1e293b", wraplength=230, justify=tk.RIGHT)
        self.lbl_title.pack(side=tk.RIGHT)

        # Active Session row
        dur_row = tk.Frame(card, bg="#1e293b")
        dur_row.pack(fill=tk.X, pady=2)
        tk.Label(dur_row, text="Session Time:", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b").pack(side=tk.LEFT)
        self.lbl_session = tk.Label(dur_row, text="0s", font=("Segoe UI", 9), fg="#f8fafc", bg="#1e293b")
        self.lbl_session.pack(side=tk.RIGHT)

        # 3. Primary Action Buttons
        btn_frame = tk.Frame(dialog, bg="#0f172a", padx=16, pady=8)
        btn_frame.pack(fill=tk.X)

        # Open Dashboard Button (Primary)
        dash_btn = tk.Button(
            btn_frame,
            text="🌐  Open Dashboard in Browser",
            font=("Segoe UI", 10, "bold"),
            bg="#0284c7",
            fg="#ffffff",
            activebackground="#0369a1",
            activeforeground="#ffffff",
            relief=tk.FLAT,
            cursor="hand2",
            pady=8,
            command=self.open_dashboard,
        )
        dash_btn.pack(fill=tk.X, pady=4)

        # Pause/Resume Button
        self.pause_btn = tk.Button(
            btn_frame,
            text="⏸  Pause Monitoring",
            font=("Segoe UI", 9),
            bg="#334155",
            fg="#f8fafc",
            activebackground="#475569",
            activeforeground="#ffffff",
            relief=tk.FLAT,
            cursor="hand2",
            pady=6,
            command=self._on_toggle_pause_click,
        )
        self.pause_btn.pack(fill=tk.X, pady=4)

        # 4. Settings Options
        opt_frame = tk.Frame(dialog, bg="#0f172a", padx=16, pady=4)
        opt_frame.pack(fill=tk.X)

        self.autostart_var = tk.BooleanVar(value=is_autostart_enabled())
        autostart_cb = tk.Checkbutton(
            opt_frame,
            text="Launch automatically on computer boot",
            variable=self.autostart_var,
            command=self.toggle_autostart,
            font=("Segoe UI", 9),
            bg="#0f172a",
            fg="#cbd5e1",
            selectcolor="#1e293b",
            activebackground="#0f172a",
            activeforeground="#f8fafc",
        )
        autostart_cb.pack(anchor=tk.W)

        # 5. Bottom Actions (Close to Tray & Exit)
        bot_frame = tk.Frame(dialog, bg="#0f172a", padx=16, pady=10)
        bot_frame.pack(fill=tk.X, side=tk.BOTTOM)

        exit_btn = tk.Button(
            bot_frame,
            text="🛑 Exit WorkPulse",
            font=("Segoe UI", 9),
            bg="#7f1d1d",
            fg="#fecaca",
            activebackground="#991b1b",
            activeforeground="#ffffff",
            relief=tk.FLAT,
            cursor="hand2",
            padx=12,
            pady=4,
            command=self.quit,
        )
        exit_btn.pack(side=tk.LEFT)

        close_btn = tk.Button(
            bot_frame,
            text="Close to Tray",
            font=("Segoe UI", 9),
            bg="#334155",
            fg="#f8fafc",
            activebackground="#475569",
            activeforeground="#ffffff",
            relief=tk.FLAT,
            cursor="hand2",
            padx=14,
            pady=4,
            command=self.hide_dialog,
        )
        close_btn.pack(side=tk.RIGHT)

        self.status_dialog = dialog
        self._refresh_dialog_data()

    def _on_toggle_pause_click(self):
        self.toggle_monitoring()
        self._update_dialog_ui_state()

    def _update_dialog_ui_state(self):
        if not self.status_dialog:
            return
        if self.is_monitoring:
            self.status_badge.config(text="● Active", fg="#34d399", bg="#064e3b")
            self.pause_btn.config(text="⏸  Pause Monitoring")
        else:
            self.status_badge.config(text="⏸ Paused", fg="#fbbf24", bg="#78350f")
            self.pause_btn.config(text="▶  Resume Monitoring")

    def _refresh_dialog_data(self):
        """Periodically refresh dialog telemetry when visible."""
        if not self._running or not self.status_dialog:
            return

        if self.status_dialog.state() == "normal":
            data = self.get_backend_status()
            app = data.get("currentApp", "Unknown")
            title = data.get("currentTitle", "Unknown")
            if len(title) > 36:
                title = title[:33] + "..."
            sec = int(data.get("currentSessionActiveSeconds", 0.0))

            mins, s = divmod(sec, 60)
            hours, m = divmod(mins, 60)
            duration_str = f"{hours}h {m}m {s}s" if hours > 0 else f"{m}m {s}s"

            self.lbl_app.config(text=app)
            self.lbl_title.config(text=title)
            self.lbl_session.config(text=duration_str)
            self._update_dialog_ui_state()

        # Schedule next refresh every 1.5 seconds
        if self.tk_root and self._running:
            self.tk_root.after(1500, self._refresh_dialog_data)

    def _setup_pystray(self):
        """Initialize and run the pystray icon menu."""
        if pystray is None:
            logger.warning("pystray is unavailable; system tray icon will not be displayed.")
            return

        try:
            image = create_tray_icon_image()

            def on_toggle_pause_menu(icon, item):
                self.toggle_monitoring()

            def on_autostart_menu(icon, item):
                self.toggle_autostart()

            def autostart_checked(item):
                return is_autostart_enabled()

            menu = pystray.Menu(
                pystray.MenuItem("⚡ WorkPulse Status", lambda icon, item: self.show_dialog(), default=True),
                pystray.MenuItem("🌐 Open Dashboard", lambda icon, item: self.open_dashboard()),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("⏸ Pause / Resume", on_toggle_pause_menu),
                pystray.MenuItem("☑ Start with Windows", on_autostart_menu, checked=autostart_checked),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Exit WorkPulse", lambda icon, item: self.quit()),
            )

            self.icon = pystray.Icon(
                "WorkPulse",
                image,
                title=f"{APP_TITLE} v{VERSION} - Monitoring Active",
                menu=menu,
            )
            self.icon.run()
        except Exception as e:
            logger.warning(f"Error running pystray system tray: {e}")

    def run(self, show_dialog_on_start=False):
        """Launch the background tray application and initialize the Tkinter loop."""
        try:
            import tkinter as tk
            self.tk_root = tk.Tk()
            self.tk_root.withdraw()  # Root window remains hidden; Toplevel is used for dialog
        except Exception as e:
            logger.warning(f"Tkinter GUI display not available (headless environment): {e}")
            self.tk_root = None

        # Start pystray in a dedicated daemon thread if available
        if pystray is not None:
            try:
                tray_thread = threading.Thread(target=self._setup_pystray, daemon=True)
                tray_thread.start()
            except Exception as e:
                logger.warning(f"Failed to start tray thread: {e}")

        if self.tk_root:
            if show_dialog_on_start:
                self.tk_root.after(500, self.show_dialog)
            logger.info("WorkPulse System Tray resident app active.")
            try:
                self.tk_root.mainloop()
            except KeyboardInterrupt:
                self.quit()
        else:
            # Headless fallback loop
            logger.info("WorkPulse running in headless background mode.")
            try:
                while self._running:
                    time.sleep(1)
            except KeyboardInterrupt:
                self.quit()

    def quit(self):
        """Gracefully shut down system tray and trigger master exit callback."""
        logger.info("Exiting WorkPulse System Tray...")
        self._running = False
        if self.icon:
            try:
                self.icon.stop()
            except Exception:
                pass
        if self.tk_root:
            try:
                self.tk_root.quit()
                self.tk_root.destroy()
            except Exception:
                pass
        if self.on_exit_callback:
            self.on_exit_callback()


if __name__ == "__main__":
    app = WorkPulseTrayApp()
    app.run(show_dialog_on_start=True)
