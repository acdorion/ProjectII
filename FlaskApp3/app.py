import os

import pandas as pd
import numpy as np

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)


#################################################
# Database Setup
#################################################
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db/marriage_and_divorce_rates.sqlite"
db = SQLAlchemy(app)

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(db.engine, reflect=True)

# Save references to each table
marriage_rate_metadata = Base.classes.marriage_rates
divorce_rate_metadata = Base.classes.divorce_rates
# Samples = Base.classes.samples


@app.route("/")
def index():
    """Return the homepage."""
    return render_template("index.html")


@app.route("/metadata/year/<year>")
def divorce_rates_by_year(year):
    sel = [
        divorce_rate_metadata.State,
        getattr(divorce_rate_metadata, 'Y_'+year),
        # getattr(marriage_rate_metadata, 'Y_'+year)
    ]

    results = db.session.query(*sel).all()

    sel2 = [
        marriage_rate_metadata.State,
        getattr(marriage_rate_metadata, 'Y_'+year)
    ]
    results_mr = db.session.query(*sel2).all()

    # Format the data to send as json
    data = {
        "states": [result[0] for result in results],
        "divorce_rates": [result[1] for result in results],
        "marriage_rates": [result[1] for result in results_mr]
    }

    return jsonify(data)


@app.route("/metadata/state/<state>")
def divorce_rates_by_state(state):

    stmt = db.session.query(divorce_rate_metadata).statement
    mr_stmt = db.session.query(marriage_rate_metadata).statement

    df = pd.read_sql_query(stmt, db.session.bind)
    df_mr = pd.read_sql_query(mr_stmt, db.session.bind)

    sample_data = df.loc[df['State'] == state, :]
    sample_data_mr = df_mr.loc[df_mr['State'] == state, :]

    years = [ year.split('_')[-1] for year in sample_data.columns.values[2:]]
    # years_dr = [year.split('_')[-1] for year in sample_data_dr.columns.values[2:]]

    divorce_rates = sample_data.values[0][2:]
    marriage_rates = sample_data_mr.values[0][2:]

    data = {
        'year': years,
        'divorce_rates': divorce_rates.tolist(),
        'marriage': marriage_rates.tolist()
    }

    return jsonify(data)


@app.route("/states")
def states():
    sel = [divorce_rate_metadata.State]

    states = [state[0] for state in db.session.query(*sel).all()]

    return jsonify(states)


@app.route("/years")
def years():
    stmt = db.session.query(divorce_rate_metadata).statement

    df = pd.read_sql_query(stmt, db.session.bind)

    sample_data = df.loc[:,:]

    years = [year.split('_')[-1] for year in sample_data.columns.values[2:]]

    return jsonify(years)


if __name__ == "__main__":
    app.run()