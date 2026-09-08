"""Setup script for WorkPulse development and distribution."""

from setuptools import find_packages, setup

setup(
    name="workpulse",
    version="0.2.2",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[
        "psutil>=5.8.0",
        "cryptography>=3.4.0",
        "python-dotenv>=1.0.0",
    ],
    entry_points={
        "console_scripts": [
            "workpulse=run:main",
        ],
    },
)
