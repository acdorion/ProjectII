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
def marriage_rates_by_year(year):
    sel = [
        marriage_rate_metadata.State,
        getattr(marriage_rate_metadata, 'Y_'+year),
        # getattr(divorce_rate_metadata, 'Y_'+year)
    ]

    results = db.session.query(*sel).all()

    sel2 = [
        divorce_rate_metadata.State,
        getattr(divorce_rate_metadata, 'Y_'+year)
    ]
    results_dr = db.session.query(*sel2).all()

    # Format the data to send as json
    data = {
        "states": [result[0] for result in results],
        "marriage_rates": [result[1] for result in results],
        "divorce_rates": [result[1] for result in results_dr]
    }

    return jsonify(data)


@app.route("/metadata/state/<state>")
def marriage_rates_by_state(state):

    stmt = db.session.query(marriage_rate_metadata).statement
    dr_stmt = db.session.query(divorce_rate_metadata).statement

    df = pd.read_sql_query(stmt, db.session.bind)
    df_dr = pd.read_sql_query(dr_stmt, db.session.bind)

    sample_data = df.loc[df['State'] == state, :]
    sample_data_dr = df_dr.loc[df_dr['State'] == state, :]

    years = [ year.split('_')[-1] for year in sample_data.columns.values[2:]]
    # years_dr = [year.split('_')[-1] for year in sample_data_dr.columns.values[2:]]

    marriage_rates = sample_data.values[0][2:]
    divorce_rates = sample_data_dr.values[0][2:]

    data = {
        'year': years,
        'marriage_rates': marriage_rates.tolist(),
        'divorce_rates': divorce_rates.tolist()
    }

    return jsonify(data)


@app.route("/states")
def states():
    sel = [marriage_rate_metadata.State]

    states = [state[0] for state in db.session.query(*sel).all()]

    return jsonify(states)


@app.route("/years")
def years():
    stmt = db.session.query(marriage_rate_metadata).statement

    df = pd.read_sql_query(stmt, db.session.bind)

    sample_data = df.loc[:,:]

    years = [year.split('_')[-1] for year in sample_data.columns.values[2:]]

    return jsonify(years)


if __name__ == "__main__":
    app.run()