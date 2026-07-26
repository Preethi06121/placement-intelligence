import runpy


def create_app():
    return runpy.run_path("app.py")["app"]


app = create_app()
